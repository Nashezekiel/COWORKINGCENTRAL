import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PricingTier {
  id: number;
  planType: string;
  amount: number;
  description: string;
  lastUpdated: string;
  updatedBy: number | null;
}

const PricingManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdminOrManager = user && (user.role === "super_admin" || user.role === "manager");
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<PricingTier | null>(null);
  const [newAmount, setNewAmount] = useState<string>("");

  const { data: pricingTiers, isLoading } = useQuery<PricingTier[]>({
    queryKey: ["/api/pricing"],
    enabled: isAdminOrManager
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ planType, amount }: { planType: string; amount: number }) => {
      return apiRequest("PUT", `/api/pricing/${planType}`, { amount });
    },
    onSuccess: () => {
      toast({
        title: "Price updated",
        description: "The pricing tier has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating price",
        description: error.message || "There was an error updating the pricing tier",
        variant: "destructive"
      });
    }
  });

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditTier = (tier: PricingTier) => {
    setCurrentTier(tier);
    setNewAmount(tier.amount.toString());
    setIsEditDialogOpen(true);
  };

  const handleUpdatePrice = () => {
    if (!currentTier) return;
    
    const amount = parseInt(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive"
      });
      return;
    }
    
    updatePricingMutation.mutate({
      planType: currentTier.planType,
      amount
    });
  };

  if (!isAdminOrManager) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Pricing Management</h2>
        <button 
          type="button" 
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
          onClick={handleEditClick}
        >
          <i className="fas fa-edit mr-1.5"></i> Edit Pricing
        </button>
      </div>
      
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {pricingTiers?.map((tier) => (
            <div 
              key={tier.id} 
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              onClick={() => handleEditTier(tier)}
            >
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{tier.planType.charAt(0).toUpperCase() + tier.planType.slice(1)} Rate</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tier.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(tier.amount)} / {tier.planType}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last updated: {formatDate(tier.lastUpdated)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <i className="fas fa-info-circle mr-1"></i> Price changes will be effective immediately for new users. Existing users will transition at their next billing cycle.
        </p>
      </div>

      {/* Edit Price Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pricing</DialogTitle>
          </DialogHeader>
          {currentTier && (
            <div className="space-y-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan Type</p>
                <p className="text-base">{currentTier.planType.charAt(0).toUpperCase() + currentTier.planType.slice(1)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</p>
                <p className="text-base">{currentTier.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Amount</p>
                <p className="text-base">{formatCurrency(currentTier.amount)}</p>
              </div>
              <div>
                <label htmlFor="new-amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">New Amount</label>
                <Input
                  id="new-amount"
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="mt-1"
                  placeholder="Enter new amount"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdatePrice}
              disabled={updatePricingMutation.isPending}
            >
              {updatePricingMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                "Update Price"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManagement;
