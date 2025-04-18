import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate, getPlanTypeLabel } from '@/lib/formatters';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Download, 
  Receipt, 
  DollarSign, 
  Loader2 
} from 'lucide-react';

// Types
interface PaymentRecord {
  id: number;
  userId: number;
  amount: number;
  planType: string;
  paymentMethod: string;
  transactionId: string | null;
  status: string;
  timestamp: string;
}

interface PricingTier {
  id: number;
  planType: string;
  amount: number;
  description: string;
}

// Schema for payment form
const paymentFormSchema = z.object({
  planType: z.string({
    required_error: "Please select a plan type",
  }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
  paymentMethod: z.string({
    required_error: "Please select a payment method",
  }),
  transactionId: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Fetch payment records
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['/api/payments/user', user?.id],
    queryFn: () => apiRequest('GET', `/api/payments/user/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Fetch pricing tiers
  const { data: pricingTiers, isLoading: loadingPricing } = useQuery({
    queryKey: ['/api/pricing'],
    queryFn: () => apiRequest('GET', '/api/pricing').then(res => res.json()),
  });

  // Setup form
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      planType: '',
      amount: 0,
      paymentMethod: '',
      transactionId: '',
    },
  });

  // Handle plan type change to update amount
  const selectedPlanType = form.watch('planType');
  const selectedTier = pricingTiers?.find((tier: PricingTier) => tier.planType === selectedPlanType);

  if (selectedTier && form.getValues('amount') !== selectedTier.amount) {
    form.setValue('amount', selectedTier.amount);
  }

  // Create payment mutation
  const createPayment = useMutation({
    mutationFn: (data: PaymentFormValues) => {
      return apiRequest('POST', '/api/payments', {
        ...data,
        status: 'completed'
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment recorded successfully",
        description: "Your payment has been processed and a receipt is available",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/user', user?.id] });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: PaymentFormValues) => {
    createPayment.mutate(data);
  };

  // Generate a PDF receipt
  const generateReceipt = async (paymentId: number) => {
    setGeneratingPdf(true);
    try {
      const response = await apiRequest('GET', `/api/payments/${paymentId}/receipt`);
      const receiptData = await response.json();
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: `Receipt-${receiptData.receiptNumber}`,
        author: 'CoworkFlow',
        subject: 'Payment Receipt',
        keywords: 'receipt, payment, coworking',
      });
      
      // Add company logo/header
      doc.setFontSize(20);
      doc.setTextColor(41, 128, 185); // Blue color
      doc.text('CoworkFlow Space', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('RECEIPT', 105, 30, { align: 'center' });
      
      // Add receipt info
      doc.setFontSize(10);
      doc.text(`Receipt Number: ${receiptData.receiptNumber}`, 20, 45);
      doc.text(`Date: ${new Date(receiptData.paymentDate).toLocaleDateString()}`, 20, 52);
      
      // Customer info
      doc.setFontSize(11);
      doc.text('Bill To:', 20, 65);
      doc.setFontSize(10);
      doc.text(receiptData.customerName, 20, 72);
      doc.text(receiptData.customerEmail, 20, 79);
      
      // Payment details table
      autoTable(doc, {
        startY: 90,
        head: [['Description', 'Plan Type', 'Amount']],
        body: [
          [
            'Coworking Space Access', 
            getPlanTypeLabel(receiptData.planType), 
            `$${(receiptData.amount / 100).toFixed(2)}`
          ],
        ],
        foot: [
          ['', 'Total', `$${(receiptData.amount / 100).toFixed(2)}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      });
      
      // Payment method
      const finalY = (doc as any).lastAutoTable.finalY || 120;
      doc.text(`Payment Method: ${receiptData.paymentMethod}`, 20, finalY + 15);
      doc.text(`Status: ${receiptData.status}`, 20, finalY + 22);
      
      if (receiptData.transactionId && receiptData.transactionId !== 'N/A') {
        doc.text(`Transaction ID: ${receiptData.transactionId}`, 20, finalY + 29);
      }
      
      // Company details at the bottom
      const companyDetails = receiptData.companyDetails;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(companyDetails.name, 105, 270, { align: 'center' });
      doc.text(companyDetails.address, 105, 275, { align: 'center' });
      doc.text(`Email: ${companyDetails.email} | Phone: ${companyDetails.phone}`, 105, 280, { align: 'center' });
      
      // Save the PDF
      doc.save(`receipt-${receiptData.receiptNumber}.pdf`);
      
      toast({
        title: "Receipt downloaded",
        description: "Your receipt has been generated and downloaded",
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "Receipt generation failed",
        description: "There was an error generating your receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Billing & Payments</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Make a Payment */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Make a Payment
            </CardTitle>
            <CardDescription>
              Select a plan and payment method to make a payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={loadingPricing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pricingTiers?.map((tier: PricingTier) => (
                            <SelectItem key={tier.planType} value={tier.planType}>
                              {getPlanTypeLabel(tier.planType)} - {formatCurrency(tier.amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (cents)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="debit_card">Debit Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createPayment.isPending}
                >
                  {createPayment.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Complete Payment
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your active subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user?.planType ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Plan Type</h3>
                  <p className="font-semibold text-xl">{getPlanTypeLabel(user.planType)}</p>
                </div>
                {selectedTier && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                    <p className="font-semibold text-xl">{formatCurrency(selectedTier.amount)}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge variant="success" className="mt-1">Active</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No active plan</p>
                <p className="text-xs mt-2">Select a plan to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Payment History */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="mr-2 h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            View and download your past payment receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: PaymentRecord) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.timestamp)}</TableCell>
                    <TableCell className="font-medium">
                      {getPlanTypeLabel(payment.planType)}
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={payment.status === 'completed' ? 'success' : 
                                payment.status === 'pending' ? 'warning' : 'destructive'}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.paymentMethod.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateReceipt(payment.id)}
                        disabled={generatingPdf}
                      >
                        {generatingPdf ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payment history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}