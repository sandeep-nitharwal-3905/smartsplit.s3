import { X, Heart, Copy } from 'lucide-react';
import { useState } from 'react';
import upiQRImage from '../../../assets/upiqr.jpeg';

interface SupportModalProps {
  isDarkTheme: boolean;
  isOpen: boolean;
  onClose: () => void;
  context?: 'profile' | 'expense' | 'group';
  totalAmount?: number; // For group context
}

export function SupportModal({
  isDarkTheme,
  isOpen,
  onClose,
  context = 'profile',
  totalAmount,
}: SupportModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  // UPI ID - Replace with your actual UPI ID
  const UPI_ID = 'sandeep392005@oksbi'; // Change this to your actual UPI ID
  
  const predefinedAmounts = [11, 21, 101];

  if (!isOpen) return null;

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getContextMessage = () => {
    switch (context) {
      case 'profile':
        return 'Love SmartSplit? Buy the developer a chai (₹11) to keep the servers running! ☕';
      case 'expense':
        return 'Tracking expenses hassle-free? Support us with a chai (₹11) to keep SmartSplit free! ☕';
      case 'group':
        return totalAmount
          ? `Managed ₹${totalAmount.toFixed(2)} hassle-free? Buy the developer a chai (₹11) to keep the servers running! ☕`
          : 'Enjoying hassle-free expense tracking? Buy us a chai (₹11) to keep it free! ☕';
      default:
        return 'Buy the developer a chai (₹11) to keep SmartSplit free and awesome! ☕';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`relative w-full max-w-md rounded-xl shadow-2xl ${
          isDarkTheme ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        } max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b ${
            isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h2 className="text-xl sm:text-2xl font-bold">Support Us</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Context Message */}
          <div
            className={`p-4 rounded-lg ${
              isDarkTheme ? 'bg-gradient-to-r from-purple-900/50 to-cyan-900/50' : 'bg-gradient-to-r from-teal-50 to-cyan-50'
            }`}
          >
            <p className="text-sm sm:text-base text-center">{getContextMessage()}</p>
          </div>

          {/* Amount Selection */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${isDarkTheme ? 'text-gray-200' : 'text-gray-800'}`}>
              Choose Amount
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {predefinedAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAmountSelect(amount)}
                  className={`py-3 px-4 rounded-lg font-semibold transition transform hover:scale-105 ${
                    selectedAmount === amount
                      ? isDarkTheme
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                        : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
                      : isDarkTheme
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  ₹{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Or enter custom amount
            </label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder="Enter amount ₹(e.g., 51)"
              className={`w-full p-3 rounded-lg border ${
                isDarkTheme
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-teal-500'
              } focus:outline-none focus:ring-2 ${
                isDarkTheme ? 'focus:ring-cyan-500' : 'focus:ring-teal-500'
              }`}
            />
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${isDarkTheme ? 'text-gray-200' : 'text-gray-800'}`}>
              Payment Method
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowQR(!showQR)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                  showQR
                    ? isDarkTheme
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                      : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
                    : isDarkTheme
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {showQR ? 'Hide' : 'Show'} UPI QR Code
              </button>

              {showQR && (
                <div className="p-4 bg-white rounded-lg">
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={upiQRImage} 
                      alt="UPI QR Code" 
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-3">Scan with any UPI app</p>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {selectedAmount ? `₹${selectedAmount}` : customAmount ? `₹${customAmount}` : 'Any amount is appreciated'}
                  </p>
                </div>
              )}

              <div
                className={`p-4 rounded-lg border ${
                  isDarkTheme ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      UPI ID
                    </p>
                    <p className={`text-sm sm:text-base font-mono break-all ${isDarkTheme ? 'text-gray-100' : 'text-gray-900'}`}>
                      {UPI_ID}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyUPI}
                    className={`flex-shrink-0 p-2 rounded-lg transition ${
                      copied
                        ? 'bg-green-500 text-white'
                        : isDarkTheme
                        ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title="Copy UPI ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-500 mt-2">UPI ID copied to clipboard!</p>
                )}
              </div>
            </div>
          </div>

          {/* Note */}
          <div className={`text-xs sm:text-sm p-3 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
              💙 Your support helps us keep SmartSplit free and continuously improving. Thank you for your generosity!
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
              isDarkTheme
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
