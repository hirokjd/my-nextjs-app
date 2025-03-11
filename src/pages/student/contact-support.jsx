import React, { useState } from 'react';
import { MessageCircle, Mail, Phone, HelpCircle } from 'lucide-react';

const ContactSupport = () => {
  const [activeTab, setActiveTab] = useState('chat');

  const tabs = [
    { id: 'chat', label: 'Live Chat', icon: MessageCircle },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'phone', label: 'Phone', icon: Phone },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Contact Support</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Chat with our support team in real-time. We're here to help!
                  </p>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Start Chat
                  </button>
                </div>
              )}

              {activeTab === 'email' && (
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="What can we help you with?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your issue..."
                    ></textarea>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Send Message
                  </button>
                </form>
              )}

              {activeTab === 'phone' && (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Call our support team during business hours:
                  </p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-medium text-gray-900">
                      +1 (555) 123-4567
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Monday - Friday, 9:00 AM - 5:00 PM EST
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                    {[1, 2, 3].map((i) => (
                      <details key={i} className="p-4">
                        <summary className="font-medium text-gray-900 cursor-pointer">
                          Frequently Asked Question {i}
                        </summary>
                        <p className="mt-2 text-gray-600">
                          This is the answer to frequently asked question {i}. It provides
                          helpful information to common user inquiries.
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Links
            </h2>
            <div className="space-y-2">
              <button className="w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                User Guide
              </button>
              <button className="w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                Video Tutorials
              </button>
              <button className="w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                System Status
              </button>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Need Immediate Help?
            </h2>
            <p className="text-blue-600 mb-4">
              Our support team typically responds within 2 hours during business hours.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Contact Emergency Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
