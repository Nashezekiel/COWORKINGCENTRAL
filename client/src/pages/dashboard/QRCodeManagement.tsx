import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { generateQRCode } from "@/lib/qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { format, addDays } from "date-fns";

const QRCodeManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [accessType, setAccessType] = useState<string>("hourly");
  const [isGeneratingQR, setIsGeneratingQR] = useState<boolean>(false);

  // Get the user's monthly QR code
  const { data: userQRCode, isLoading } = useQuery({
    queryKey: ["/api/qrcode/generate"],
    enabled: !!user,
    queryFn: async () => {
      // Only fetch if the user doesn't already have a QR code
      if (!user?.currentMonthlyQrCode) {
        const response = await apiRequest("POST", "/api/qrcode/generate");
        const data = await response.json();
        return data.qrCode;
      }
      return user.currentMonthlyQrCode;
    }
  });

  // Generate guest QR code mutation
  const generateGuestQRMutation = useMutation({
    mutationFn: async ({ guestName, planType }: { guestName: string; planType: string }) => {
      const response = await apiRequest("POST", "/api/qrcode/guest", {
        guestName,
        planType
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Guest QR code generated",
        description: `QR code for ${guestName} has been generated successfully`,
      });
      setGuestName("");
      queryClient.invalidateQueries({ queryKey: ["/api/qrcode/guest"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error generating QR code",
        description: error.message || "There was an error generating the guest QR code",
        variant: "destructive"
      });
    }
  });

  // Generate QR code on component mount or when userQRCode changes
  useEffect(() => {
    const generateQRCodeImage = async () => {
      if (userQRCode) {
        try {
          setIsGeneratingQR(true);
          const dataUrl = await generateQRCode(userQRCode, {
            width: 200,
            errorCorrectionLevel: 'M',
          });
          setQrCodeDataUrl(dataUrl);
        } catch (error) {
          console.error("Error generating QR code:", error);
        } finally {
          setIsGeneratingQR(false);
        }
      }
    };

    generateQRCodeImage();
  }, [userQRCode]);

  const handleDownloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement("a");
      link.href = qrCodeDataUrl;
      link.download = `qrcode-${format(new Date(), 'yyyy-MM-dd')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShareQRCode = async () => {
    if (qrCodeDataUrl && navigator.share) {
      try {
        // Convert data URL to Blob
        const response = await fetch(qrCodeDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `qrcode-${format(new Date(), 'yyyy-MM-dd')}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'My CoworkFlow QR Code',
          text: 'Here is my QR code for CoworkFlow',
          files: [file]
        });
      } catch (error) {
        console.error("Error sharing QR code:", error);
        toast({
          title: "Sharing failed",
          description: "Could not share QR code",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your browser does not support sharing",
        variant: "destructive"
      });
    }
  };

  const handleGenerateGuestQR = async () => {
    if (!guestName) {
      toast({
        title: "Guest name required",
        description: "Please enter a name for the guest",
        variant: "destructive"
      });
      return;
    }

    generateGuestQRMutation.mutate({
      guestName,
      planType: accessType
    });
  };

  // Get QR code expiry date in readable format
  const getExpiryDateDisplay = () => {
    if (user?.qrCodeExpiryDate) {
      return format(new Date(user.qrCodeExpiryDate), "MMMM dd, yyyy");
    }
    
    // If no expiry date, show one month from now
    return format(addDays(new Date(), 30), "MMMM dd, yyyy");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
      <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">QR Code Management</h2>
      
      <div className="flex flex-col sm:flex-row gap-5">
        {/* QR Code Display */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          {isLoading || isGeneratingQR ? (
            <div className="w-44 h-44 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : qrCodeDataUrl ? (
            <img 
              src={qrCodeDataUrl} 
              alt="Your QR Code" 
              className="w-44 h-44 object-contain rounded-lg mb-3" 
            />
          ) : (
            <div className="w-44 h-44 qr-code-placeholder rounded-lg mb-3 flex items-center justify-center bg-gray-200 dark:bg-gray-600">
              <span className="text-gray-500 dark:text-gray-400">No QR Code</span>
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Monthly QR Code</h3>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">Valid until {getExpiryDateDisplay()}</p>
          <div className="mt-3 flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadQRCode}
              disabled={!qrCodeDataUrl}
              className="text-primary-700 bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800"
            >
              <i className="fas fa-download mr-1.5"></i> Download
            </Button>
            <Button 
              size="sm" 
              onClick={handleShareQRCode}
              disabled={!qrCodeDataUrl}
              className="text-white bg-primary-600 hover:bg-primary-700"
            >
              <i className="fas fa-paper-plane mr-1.5"></i> Share
            </Button>
          </div>
        </div>
        
        {/* QR Code Generation Form */}
        <div className="flex-1 flex flex-col">
          <Card className="mb-4">
            <CardContent className="pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Generate Guest QR Code</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="guest-name" className="text-xs font-medium text-gray-700 dark:text-gray-300">Guest Name</Label>
                  <Input 
                    id="guest-name" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter guest name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="access-type" className="text-xs font-medium text-gray-700 dark:text-gray-300">Access Type</Label>
                  <Select value={accessType} onValueChange={setAccessType}>
                    <SelectTrigger id="access-type" className="mt-1">
                      <SelectValue placeholder="Select access type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleGenerateGuestQR}
                  disabled={generateGuestQRMutation.isPending}
                  className="w-full"
                >
                  {generateGuestQRMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-qrcode mr-2"></i> Generate Guest QR
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">QR Code History</h3>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Last scan: Today at {format(new Date(), "hh:mm a")}</p>
              <p>Monthly code generated: {format(new Date(), "MMMM dd, yyyy")}</p>
              <p>Guest codes created this month: 5</p>
            </div>
            <div className="mt-3">
              <a href="#" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                View QR history <i className="fas fa-arrow-right ml-1"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeManagement;
