import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Store, User, Mail, FileText, Building, Upload } from 'lucide-react';

interface VendorFormData {
  type: string;
  name: string;
  email: string;
  storeName: string;
  businessRegistration?: File;
}

const vendorFormSchema = z.object({
  type: z.enum(['individual', 'company']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

export default function VendorForm() {
  const { toast } = useToast();
  const [businessRegistration, setBusinessRegistration] = useState<File | null>(null);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      type: 'individual',
      name: '',
      email: '',
      storeName: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      // Send JSON data to match the backend API
      return await apiRequest('POST', '/api/vendor/register', {
        type: data.type,
        name: data.name,
        email: data.email,
        storeName: data.storeName,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Registration Submitted',
        description: 'Your vendor application has been submitted successfully. We will review it and get back to you soon.',
      });
      form.reset();
      setBusinessRegistration(null);
    },
    onError: (error) => {
      toast({
        title: 'Registration Failed',
        description: error.message || 'There was an error submitting your application. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: VendorFormValues) => {
    registerMutation.mutate({
      ...data,
      businessRegistration: businessRegistration || undefined,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBusinessRegistration(file);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Become a Vendor</CardTitle>
        <CardDescription>
          Join our marketplace and start selling your products to thousands of customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Vendor Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">Vendor Type</Label>
            <Select
              value={form.watch('type')}
              onValueChange={(value) => form.setValue('type', value as 'individual' | 'company')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Individual Seller
                  </div>
                </SelectItem>
                <SelectItem value="company">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Company/Business
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>
            )}
          </div>

          {/* Business/Individual Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {form.watch('type') === 'company' ? 'Business Name' : 'Full Name'}
            </Label>
            <Input
              id="name"
              placeholder={form.watch('type') === 'company' ? 'Enter your business name' : 'Enter your full name'}
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="pl-10"
                {...form.register('email')}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Store Name */}
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <div className="relative">
              <Store className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="storeName"
                placeholder="Enter your store name"
                className="pl-10"
                {...form.register('storeName')}
              />
            </div>
            {form.formState.errors.storeName && (
              <p className="text-sm text-red-600">{form.formState.errors.storeName.message}</p>
            )}
          </div>

          {/* Business Registration (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="businessRegistration">
              Business Registration Document
              <span className="text-sm text-gray-500 ml-1">(Optional)</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                id="businessRegistration"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="businessRegistration"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {businessRegistration ? businessRegistration.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG up to 10MB
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting Application...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Submit Application
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}