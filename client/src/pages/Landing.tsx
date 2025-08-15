import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-pilot-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-pilot-blue rounded-lg flex items-center justify-center">
                <i className="fas fa-passport text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">PassPilot</h1>
                <p className="text-sm text-gray-500">School Pass Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-pilot-blue rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-passport text-white text-4xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Efficient Pass Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            PassPilot provides comprehensive tools for teachers and administrators to maintain student 
            safety while reducing classroom disruptions.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-pilot-blue hover:bg-pilot-blue-dark text-white px-8 py-3 text-lg"
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-eye text-pilot-blue text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Pass Tracking</h3>
              <p className="text-gray-600 text-sm">
                See which students are currently out of class with real-time status updates and duration tracking.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-layer-group text-gray-900 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Grade Management</h3>
              <p className="text-gray-600 text-sm">
                Manage multiple grade levels and classrooms with easy switching between student rosters.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-tablet-alt text-gray-500 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kiosk Mode</h3>
              <p className="text-gray-600 text-sm">
                Let students sign themselves in/out using a dedicated device while you maintain full oversight and control.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-bar text-purple-600 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Reports</h3>
              <p className="text-gray-600 text-sm">
                Generate comprehensive reports with filtering options and export to CSV or PDF formats.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-mobile-alt text-green-600 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile Friendly</h3>
              <p className="text-gray-600 text-sm">
                Access PassPilot from any device with a responsive design optimized for tablets and phones.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user-cog text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Controls</h3>
              <p className="text-gray-600 text-sm">
                School administrators can manage teacher accounts, billing, and configure system settings.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-pilot-blue rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Classroom Management?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of teachers and schools already using PassPilot to create
            safer, more organized learning environments.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              variant="secondary"
              size="lg"
              className="bg-white text-pilot-blue hover:bg-gray-100"
              data-testid="button-start-free-trial"
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-pilot-blue"
              data-testid="button-view-pricing"
            >
              View Pricing & Plans
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-pilot-blue"
              data-testid="button-schedule-demo"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-pilot-blue rounded-lg flex items-center justify-center">
              <i className="fas fa-passport text-white text-sm"></i>
            </div>
            <span className="text-white font-semibold text-lg">PassPilot</span>
          </div>
          <div className="text-gray-400 mb-4">
            <h3 className="font-medium">Support</h3>
            <p className="text-sm">
              Email us at:{" "}
              <a href="mailto:passpilotapp@gmail.com" className="text-pilot-blue hover:underline">
                passpilotapp@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
