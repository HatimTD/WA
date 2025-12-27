'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { waDevLogin } from '@/lib/actions/waDevLoginAction';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

const AVAILABLE_ROLES = [
  { value: 'VIEWER', label: 'Viewer', description: 'Browse approved cases (read-only)' },
  { value: 'CONTRIBUTOR', label: 'Contributor', description: 'Create and submit case studies' },
  { value: 'APPROVER', label: 'Approver', description: 'Review and approve submissions' },
  { value: 'MARKETING', label: 'Marketing', description: 'Marketing team access' },
  { value: 'IT_DEPARTMENT', label: 'IT Department', description: 'IT administration access' },
  { value: 'ADMIN', label: 'Admin', description: 'Full system access' },
];

export default function DevLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@weldingalloys.com');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['CONTRIBUTOR']);
  const [isLoading, setIsLoading] = useState(false);

  const waToggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRoles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    setIsLoading(true);

    try {
      const result = await waDevLogin(email, password, selectedRoles);

      if (result?.success) {
        toast.success(`Login successful as ${selectedRoles.join(', ')}!`);
        router.push('/dashboard');
        router.refresh();
      } else if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
      }
      // If result is undefined, the redirect was handled by NextAuth
    } catch (error: any) {
      // NextAuth v5 may throw NEXT_REDIRECT which is expected behavior
      if (error?.digest?.includes('NEXT_REDIRECT')) {
        toast.success(`Login successful as ${selectedRoles.join(', ')}!`);
        // Redirect is handled automatically
        return;
      }
      toast.error('Login failed');
      setIsLoading(false);
    }
  };

  // Page is now available in production for testing purposes

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Development Login</CardTitle>
          <CardDescription>
            Login for development and testing purposes
          </CardDescription>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Test Login Mode</p>
              <p>This login is available for testing purposes.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@weldingalloys.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Roles (select one or more)</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_ROLES.map((roleOption) => (
                  <label
                    key={roleOption.value}
                    htmlFor={`role-${roleOption.value}`}
                    className={`flex items-start gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                      selectedRoles.includes(roleOption.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      id={`role-${roleOption.value}`}
                      checked={selectedRoles.includes(roleOption.value)}
                      onCheckedChange={() => waToggleRole(roleOption.value)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">
                        {roleOption.label}
                      </span>
                      <p className="text-xs text-muted-foreground truncate">
                        {roleOption.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedRoles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedRoles.join(', ')}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="text-xs text-center text-muted-foreground mt-4">
              <p>Default credentials:</p>
              <p className="font-mono mt-1">admin@weldingalloys.com / TestPassword123</p>
            </div>

            <div className="text-center mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Need a test account?</p>
              <Link href="/dev-register" className="text-blue-600 hover:underline text-sm">
                Create Test Account →
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
