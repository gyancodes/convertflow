import React, { useState } from 'react';
import { Crown, Check, X, Zap, Shield, Download, Users } from 'lucide-react';

export interface PremiumTier {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  price: string;
  maxFileSize: number; // in MB
  maxBatchSize: number;
  features: string[];
  limitations: string[];
}

export const PREMIUM_TIERS: PremiumTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    maxFileSize: 5,
    maxBatchSize: 3,
    features: [
      'Basic PNG/JPEG to SVG conversion',
      'Up to 3 files per batch',
      'Standard quality settings',
      'Download individual files'
    ],
    limitations: [
      'Max 5MB per file',
      'Limited conversion options',
      'No batch download',
      'Basic support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99/month',
    maxFileSize: 50,
    maxBatchSize: 25,
    features: [
      'Advanced vectorization options',
      'Up to 25 files per batch',
      'High-quality conversion presets',
      'Batch download as ZIP',
      'Priority processing',
      'Email support',
      'No watermarks'
    ],
    limitations: [
      'Max 50MB per file'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$29.99/month',
    maxFileSize: 200,
    maxBatchSize: 100,
    features: [
      'Unlimited file size (up to 200MB)',
      'Up to 100 files per batch',
      'Custom conversion settings',
      'API access',
      'White-label solution',
      'Priority support',
      'Advanced analytics',
      'Team collaboration'
    ],
    limitations: []
  }
];

interface PremiumFeaturesProps {
  currentTier: PremiumTier['id'];
  onUpgrade: (tier: PremiumTier['id']) => void;
  onClose?: () => void;
}

export const PremiumFeatures: React.FC<PremiumFeaturesProps> = ({
  currentTier,
  onUpgrade,
  onClose
}) => {
  const [selectedTier, setSelectedTier] = useState<PremiumTier['id']>(currentTier);

  const handleUpgrade = () => {
    onUpgrade(selectedTier);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
          <p className="text-gray-600 mt-2">
            Choose the perfect plan for your conversion needs
          </p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {PREMIUM_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
                  selectedTier === tier.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${tier.id === 'pro' ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.id === 'pro' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{tier.price}</div>
                  {tier.id !== 'free' && (
                    <div className="text-gray-500 text-sm">per month</div>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="text-sm text-gray-600">
                    <strong>File Limits:</strong>
                    <div>Max {tier.maxFileSize}MB per file</div>
                    <div>Up to {tier.maxBatchSize} files per batch</div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Features:</h4>
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {tier.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Limitations:</h4>
                      <ul className="space-y-2">
                        {tier.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    tier.id === currentTier
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : selectedTier === tier.id
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={tier.id === currentTier}
                >
                  {tier.id === currentTier ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleUpgrade}
              disabled={selectedTier === currentTier}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                selectedTier === currentTier
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {selectedTier === currentTier ? 'Already on this plan' : 'Upgrade Now'}
            </button>
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Why Upgrade?
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span>Faster processing with priority queues</span>
              </div>
              <div className="flex items-start space-x-2">
                <Download className="w-4 h-4 text-blue-500 mt-0.5" />
                <span>Batch downloads and advanced formats</span>
              </div>
              <div className="flex items-start space-x-2">
                <Users className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Team collaboration and sharing</span>
              </div>
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-purple-500 mt-0.5" />
                <span>Enterprise-grade security and support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getCurrentTier = (userTier?: string): PremiumTier => {
  return PREMIUM_TIERS.find(tier => tier.id === userTier) || PREMIUM_TIERS[0];
};

export const checkFileLimit = (fileSize: number, tier: PremiumTier): boolean => {
  return fileSize <= tier.maxFileSize * 1024 * 1024; // Convert MB to bytes
};

export const checkBatchLimit = (batchSize: number, tier: PremiumTier): boolean => {
  return batchSize <= tier.maxBatchSize;
};