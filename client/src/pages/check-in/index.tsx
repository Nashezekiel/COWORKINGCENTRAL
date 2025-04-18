import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { generateQRCode } from "@/lib/qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QrReader from "react-qr-reader";

interface CheckInResult {
  id: number;
  userId: number;
  checkInTime: string;
  checkOutTime: string | null;
  duration: number | null;
  planType: string;
}

const CheckIn = () => {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [qrValue, setQrValue] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("scan");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<string>("environment");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user's active check-in status
  const { data: activeCheckIn, isLoading: checkInLoading, refetch: refetchCheckIn } = useQuery<CheckInResult>({
    queryKey: ["/api/checkins/active", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/checkins/active/${user?.id}`);
        return response.json();
      } catch (error) {
        return null;
      }
    }
  });

  // Generate QR code for the user
  useEffect(() => {
    const generateQRCodeImage = async () => {
      if (user?.currentMonthlyQrCode) {
        try {
          const dataUrl = await generateQRCode(user.currentMonthlyQrCode, {
            width: 200,
            errorCorrectionLevel: 'M',
          });
          setQrCodeDataUrl(dataUrl);
        } catch (error) {
          console.error("Error generating QR code:", error);
        }
      }
    };

    generateQRCodeImage();
  }, [user]);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/checkin");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Check-in successful",
        description: "You have been checked in",
      });
      refetchCheckIn();
      refetchUser();
    },
    onError: (error: any) => {
      toast({
        title: "Check-in failed",
        description: error.message || "There was an error checking in",
        variant: "destructive"
      });
    }
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/checkout");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Check-out successful",
        description: "You have been checked out",
      });
      refetchCheckIn();
      refetchUser();
    },
    onError: (error: any) => {
      toast({
        title: "Check-out failed",
        description: error.message || "There was an error checking out",
        variant: "destructive"
      });
    }
  });

  // Verify QR code mutation
  const verifyQRMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const response = await apiRequest("POST", "/api/qrcode/verify", { qrCode });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "QR code verified",
        description: `Successfully verified QR code for ${data.user.name}`,
      });
      setScanResult(`QR code valid: ${data.user.name}`);
      setIsScanning(false);
      // Check in the user after successful scan
      checkInMutation.mutate();
    },
    onError: (error: any) => {
      toast({
        title: "QR code verification failed",
        description: error.message || "Invalid or expired QR code",
        variant: "destructive"
      });
      setScanResult("Invalid QR code");
      setIsScanning(false);
    }
  });

  const handleQrScan = (data: string | null) => {
    if (data) {
      setScanResult(data);
      verifyQRMutation.mutate(data);
      setIsScanning(false);
    }
  };

  const handleScanError = (err: any) => {
    console.error(err);
    toast({
      title: "Scanner Error",
      description: "Could not access the camera",
      variant: "destructive"
    });
    setIsScanning(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Here you would extract the QR code data
            // In a real implementation, you would use a library like jsQR
            // For now, we'll just show an error message
            toast({
              title: "QR Code Processing",
              description: "QR code processing from images is not implemented yet",
              variant: "destructive"
            });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualCheckIn = () => {
    if (!qrValue) {
      toast({
        title: "QR code required",
        description: "Please enter a QR code value",
        variant: "destructive"
      });
      return;
    }

    verifyQRMutation.mutate(qrValue);
  };

  const toggleCamera = () => {
    setFacingMode(facingMode === "environment" ? "user" : "environment");
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    setScanResult(null);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Check-In / Check-Out</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* QR Code Scanner Section */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code Scanner</CardTitle>
              <CardDescription>
                Scan a QR code to check in or out
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="scan" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="scan">Scan</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                </TabsList>
                
                <TabsContent value="scan" className="space-y-4">
                  {isScanning ? (
                    <div className="aspect-square max-w-md mx-auto overflow-hidden rounded-lg relative">
                      {/*
                        In a real implementation, we would use a proper QR code scanner component.
                        For brevity, I'm using a placeholder component name.
                        You would need to install a package like "react-qr-reader".
                      */}
                      <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">
                          Camera preview would appear here
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={toggleCamera}
                      >
                        <i className="fas fa-sync-alt mr-1"></i> Switch Camera
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      {scanResult && (
                        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">
                          {scanResult}
                        </div>
                      )}
                      <Button onClick={handleStartScanning}>
                        <i className="fas fa-qrcode mr-2"></i> Start Scanning
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="upload">
                  <div className="text-center space-y-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12">
                      <div className="space-y-2">
                        <div className="mx-auto h-12 w-12 text-gray-400">
                          <i className="fas fa-file-upload text-3xl"></i>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                            <span>Upload QR code image</span>
                            <input 
                              id="file-upload" 
                              name="file-upload" 
                              type="file" 
                              className="sr-only" 
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleFileUpload}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-file-image mr-2"></i> Select File
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="manual">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="qr-value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        QR Code Value
                      </label>
                      <Input
                        id="qr-value"
                        value={qrValue}
                        onChange={(e) => setQrValue(e.target.value)}
                        placeholder="Enter QR code value"
                      />
                    </div>
                    <Button 
                      onClick={handleManualCheckIn}
                      disabled={!qrValue || verifyQRMutation.isPending}
                    >
                      {verifyQRMutation.isPending ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-qrcode mr-2"></i> Verify QR Code
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* User Check-In Status Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Check-In Status</CardTitle>
              <CardDescription>
                View your current status and check in or out
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checkInLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : activeCheckIn ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                        <i className="fas fa-check text-green-600 dark:text-green-400"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Currently Checked In</h3>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          You checked in at {new Date(activeCheckIn.checkInTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Check-in time:</span>
                      <span className="text-sm font-medium">{new Date(activeCheckIn.checkInTime).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Plan type:</span>
                      <span className="text-sm font-medium capitalize">{activeCheckIn.planType}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => checkOutMutation.mutate()}
                    disabled={checkOutMutation.isPending}
                  >
                    {checkOutMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Checking out...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-out-alt mr-2"></i> Check Out
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <i className="fas fa-info-circle text-gray-600 dark:text-gray-400"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Not Checked In</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          You are not currently checked in
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {qrCodeDataUrl && (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-40 h-40 rounded-lg overflow-hidden">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="Your QR Code" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Your personal QR code
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full"
                    onClick={() => checkInMutation.mutate()}
                    disabled={checkInMutation.isPending}
                  >
                    {checkInMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Checking in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt mr-2"></i> Check In
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center pt-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You can also check in by scanning your QR code
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
