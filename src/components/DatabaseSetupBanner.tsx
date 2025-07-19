import { useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DatabaseSetupBannerProps {
  onClose?: () => void;
}

export const DatabaseSetupBanner = ({ onClose }: DatabaseSetupBannerProps) => {
  const [copied, setCopied] = useState(false);

  const copySetupCommand = () => {
    navigator.clipboard.writeText('npm run setup-db');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-yellow-50 border-yellow-200 p-4 mb-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Database Setup Required
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            The database schema needs to be set up for the app to work properly.
          </p>
          
          <div className="bg-white p-3 rounded border border-yellow-200 mb-3">
            <p className="text-xs text-gray-600 mb-2">Run this command in your terminal:</p>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                npm run setup-db
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copySetupCommand}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-yellow-600 space-y-1">
            <p>• Follow the instructions to copy the schema to Supabase</p>
            <p>• Enable the earthdistance extension</p>
            <p>• Refresh the page after setup</p>
          </div>
        </div>
        
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-yellow-600 hover:text-yellow-800"
          >
            ×
          </Button>
        )}
      </div>
    </Card>
  );
}; 