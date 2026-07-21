import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const certificateTypes = [
  { id: 'birth', icon: '👶', label: 'Birth Certificate', desc: 'For newborns and registration', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-400/40', iconBg: 'bg-blue-50', text: 'text-blue-700' },
  { id: 'citizenship', icon: '🪪', label: 'Citizenship', desc: 'Nepali citizenship document', color: 'from-green-500/20 to-green-600/10', border: 'border-green-400/40', iconBg: 'bg-green-50', text: 'text-green-700' },
  { id: 'residence', icon: '🏠', label: 'Residence', desc: 'Proof of residence certificate', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-400/40', iconBg: 'bg-purple-50', text: 'text-purple-700' },
  { id: 'marriage', icon: '💍', label: 'Marriage', desc: 'Marriage registration certificate', color: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-400/40', iconBg: 'bg-pink-50', text: 'text-pink-700' },
  { id: 'death', icon: '📋', label: 'Death Certificate', desc: 'Official death registration', color: 'from-slate-500/20 to-slate-600/10', border: 'border-slate-400/40', iconBg: 'bg-slate-50', text: 'text-slate-700' },
  { id: 'income', icon: '💰', label: 'Income Certificate', desc: 'Proof of income document', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-400/40', iconBg: 'bg-amber-50', text: 'text-amber-700' },
  { id: 'character', icon: '⭐', label: 'Character Certificate', desc: 'Good conduct certificate', color: 'from-teal-500/20 to-teal-600/10', border: 'border-teal-400/40', iconBg: 'bg-teal-50', text: 'text-teal-700' },
];

const stats = [
  { label: 'Applications Processed', value: '24,500+', icon: '📋' },
  { label: 'Certificates Issued', value: '18,200+', icon: '🎖️' },
  { label: 'Registered Citizens', value: '9,800+', icon: '👥' },
  { label: 'Municipalities Served', value: '15+', icon: '🏛️' },
];

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600">
        {/* Subtle overlay pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
          }}
        />
        {/* Animated particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full animate-bounce-soft opacity-40" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-white rounded-full animate-bounce-soft opacity-30"
             style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-white rounded-full animate-bounce-soft opacity-30"
             style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30
                          rounded-full px-4 py-2 text-sm text-white mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            Nepal Government Digital Services Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight animate-slide-up">
            स्मार्ट सरकार
            <br />
            <span className="text-yellow-300 text-4xl sm:text-5xl lg:text-6xl font-bold">
              Smart Government Services
            </span>
          </h1>

          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 animate-slide-up"
             style={{ animationDelay: '0.1s' }}>
            Apply for government certificates online. Real-time tracking, AI-assisted forms,
            and instant digital delivery — right from your home.
          </p>

          <div className="flex flex-wrap gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {isAuthenticated ? (
              user?.role === 'admin' ? (
                <>
                  <Link to="/admin" className="bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-base shadow-lg">
                    🛡️ Admin Dashboard
                  </Link>
                  <Link to="/admin/applications" className="bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-base">
                    📋 Manage Applications
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/apply" className="bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-base shadow-lg">
                    🚀 Apply for Certificate
                  </Link>
                  <Link to="/dashboard" className="bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-base">
                    📊 My Dashboard
                  </Link>
                </>
              )
            ) : (
              <>
                <Link to="/register" className="bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-base shadow-lg">
                  🎉 Get Started Free
                </Link>
                <Link to="/login" className="bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-base">
                  🔑 Sign In
                </Link>
              </>
            )}
          </div>

          {isAuthenticated && user && (
            <p className="mt-6 text-blue-200 text-sm animate-fade-in">
              Welcome back, <span className="font-semibold text-white">{user.fullName}</span>! 👋
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{stat.icon}</div>
                <div className="text-3xl font-bold text-blue-700 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificate Types */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-3">
            Available <span className="text-blue-600">Certificates</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Apply for any government certificate online. Our AI-assisted forms make the process quick and easy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {certificateTypes.map((cert) => (
            <Link
              key={cert.id}
              to={isAuthenticated ? `/apply?type=${cert.id}` : '/register'}
              className={`bg-white border ${cert.border} rounded-2xl p-6 shadow-sm
                          hover:shadow-md hover:-translate-y-1 transition-all duration-300 group`}
            >
              <div className={`w-14 h-14 rounded-xl ${cert.iconBg} border ${cert.border}
                              flex items-center justify-center text-2xl mb-4
                              group-hover:scale-110 transition-transform duration-300`}>
                {cert.icon}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{cert.label}</h3>
              <p className="text-gray-500 text-sm">{cert.desc}</p>
              <div className={`mt-4 flex items-center gap-1.5 ${cert.text} text-xs font-medium`}>
                Apply Now
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">
              How It <span className="text-blue-600">Works</span>
            </h2>
            <p className="text-gray-500">Three simple steps to get your certificate</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-500 to-teal-500" />

            {[
              { step: '01', icon: '📝', title: 'Fill Smart Form', desc: 'Our AI assists you in filling out the application form accurately and quickly.' },
              { step: '02', icon: '📤', title: 'Upload Documents', desc: 'Securely upload required documents. We support all standard formats.' },
              { step: '03', icon: '🎖️', title: 'Get Certificate', desc: 'Receive your approved certificate digitally. Download anytime, anywhere.' },
            ].map((step) => (
              <div key={step.step} className="text-center relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-600 flex flex-col items-center justify-center
                                mx-auto mb-6 shadow-lg relative z-10">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-xs font-bold text-blue-200 mt-1">{step.step}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="bg-gradient-to-br from-blue-600 to-teal-600 rounded-3xl p-12 shadow-xl">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Go Digital? 🚀
              </h2>
              <p className="text-blue-100 text-lg mb-8">
                Join thousands of citizens who are already using Smart Gov Nepal for their certificate needs.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/register" className="bg-white text-blue-700 font-bold px-10 py-4 rounded-xl hover:bg-blue-50 transition-colors text-base shadow-lg">
                  Create Free Account
                </Link>
                <Link to="/login" className="bg-transparent border-2 border-white text-white font-bold px-10 py-4 rounded-xl hover:bg-white/10 transition-colors text-base">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🇳🇵</span>
            <span className="font-bold text-gray-700">Smart Gov Nepal</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2026 Government of Nepal — Smart Local Government Platform. All rights reserved.
          </p>
          <div className="flex gap-6 justify-center mt-4">
            <Link to="/terms" className="text-gray-400 hover:text-gray-600 text-xs transition-colors">Terms</Link>
            <Link to="/privacy" className="text-gray-400 hover:text-gray-600 text-xs transition-colors">Privacy</Link>
            <Link to="/verify/CERT-DEMO-2024-000001" className="text-gray-400 hover:text-gray-600 text-xs transition-colors">Verify Certificate</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
