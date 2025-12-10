'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { devLogin } from '@/lib/actions/dev-login-action';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function DevLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@weldingalloys.com');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CONTRIBUTOR');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await devLogin(email, password, role);

      if (result?.success) {
        toast.success(`Login successful as ${role}!`);
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
        toast.success(`Login successful as ${role}!`);
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

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">
                    <div className="flex flex-col">
                      <span className="font-medium">VIEWER</span>
                      <span className="text-xs text-muted-foreground">
                        Browse approved cases (read-only)
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CONTRIBUTOR">
                    <div className="flex flex-col">
                      <span className="font-medium">CONTRIBUTOR</span>
                      <span className="text-xs text-muted-foreground">
                        Create and submit case studies
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="APPROVER">
                    <div className="flex flex-col">
                      <span className="font-medium">APPROVER</span>
                      <span className="text-xs text-muted-foreground">
                        Review and approve submissions
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex flex-col">
                      <span className="font-medium">ADMIN</span>
                      <span className="text-xs text-muted-foreground">
                        Full system access
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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
