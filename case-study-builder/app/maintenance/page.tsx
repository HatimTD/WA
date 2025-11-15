import { prisma } from '@/lib/prisma';
import { Wrench, Clock, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import MaintenanceCheckButton from '@/components/maintenance-check-button';

export default async function MaintenancePage() {
  // Get maintenance message from system config
  const maintenanceMessage = await prisma.systemConfig.findUnique({
    where: { key: 'maintenance_message' },
  });

  const customMessage =
    maintenanceMessage?.value ||
    'We are currently performing scheduled maintenance to improve your experience. We apologize for any inconvenience and appreciate your patience.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-wa-green-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo and Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-wa-green-500 to-purple-600 mb-6 shadow-2xl animate-pulse">
            <Wrench className="h-16 w-16 text-white animate-bounce" />
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-in fade-in slide-in-from-top-4 duration-600">
            Under Maintenance
          </h1>

          <p className="text-xl text-gray-600 animate-in fade-in slide-in-from-top-4 duration-600 delay-200">
            We&apos;ll be back shortly
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
            {/* Custom Message */}
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">
                {customMessage}
              </p>
            </div>

            {/* Status Info */}
            <div className="grid md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3 p-4 bg-wa-green-50 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-wa-green-500 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Estimated Downtime
                  </p>
                  <p className="text-sm text-gray-600">
                    We&apos;ll be back soon
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Need Help?
                  </p>
                  <p className="text-sm text-gray-600">
                    Contact support team
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="pt-4">
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-wa-green-500 via-purple-500 to-pink-500 animate-shimmer" />
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Your data is safe and secure. No action is required from your side.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Check Status Button */}
        <div className="text-center mt-8">
          <MaintenanceCheckButton />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Thank you for your patience and understanding
          </p>
        </div>
      </div>
    </div>
  );
}
