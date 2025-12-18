import Header from '@/components/Header';
import { Plus, Fingerprint, Database, Download, Shield, CheckCircle, Clock, XCircle, User } from 'lucide-react';

const DashboardPage = () => {
  const stats = [
    { name: 'Total Biometric Records', value: '1,254', change: '+5%', changeType: 'positive' },
    { name: 'Active Users', value: '89', change: '+2%', changeType: 'positive' },
    { name: 'Verification Success Rate', value: '98.7%', change: '+0.3%', changeType: 'positive' },
    { name: 'Pending Verifications', value: '12', change: '-15%', changeType: 'negative' },
  ];

  const quickActions = [
    {
      name: 'Collect New Biometric',
      description: 'Add a new biometric sample to the database',
      href: '/collect',
      icon: Plus,
    },
    {
      name: 'View Records',
      description: 'Browse and manage existing biometric records',
      href: '/records',
      icon: Database,
    },
    {
      name: 'Export Data',
      description: 'Export biometric data in various formats',
      href: '/export',
      icon: Download,
    },
    {
      name: 'System Health',
      description: 'Monitor system performance and security',
      href: '/admin',
      icon: Shield,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      user: 'John Doe',
      type: 'Fingerprint biometric collected',
      status: 'verified',
      time: '2 minutes ago',
      href: '/records/abc123',
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      id: 2,
      user: 'Jane Smith',
      type: 'Face recognition processed',
      status: 'pending',
      time: '15 minutes ago',
      href: '/records/def456',
      icon: Clock,
      color: 'text-yellow-500'
    },
    {
      id: 3,
      user: 'Robert Johnson',
      type: 'Iris scan verification failed',
      status: 'failed',
      time: '1 hour ago',
      href: '/records/ghi789',
      icon: XCircle,
      color: 'text-red-500'
    },
    {
      id: 4,
      user: 'Emily Davis',
      type: 'Voice recognition verified',
      status: 'verified',
      time: '3 hours ago',
      href: '/records/jkl012',
      icon: CheckCircle,
      color: 'text-green-500'
    },
  ];

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-0 lg:flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Biometric Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back! Here's what's happening with your biometric data today.
              </p>
            </div>
            <div className="mt-5 flex lg:mt-0 lg:ml-4">
              <span className="hidden sm:block ml-3">
                <a
                  href="/collect"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none flex items-center"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  New Collection
                </a>
              </span>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-8">
            <div>
              <h2 className="text-lg leading-6 font-medium text-gray-900">Overview</h2>
              <p className="mt-1 text-sm text-gray-500">Statistics for your biometric data system.</p>
            </div>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</dd>
                    <div className="mt-1 flex items-center">
                      <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">from last month</span>
                    </div>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-gray-500">Access common functions in one click.</p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <a key={action.name} href={action.href}>
                    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-2 text-white">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-900 truncate">{action.name}</dt>
                              <dd className="mt-1 text-sm text-gray-500">{action.description}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-5 py-3 rounded-b-lg">
                        <div className="text-sm">
                          <a href={action.href} className="font-medium text-indigo-700 hover:text-indigo-900 flex items-center">
                            <span>Access now</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h2>
            <p className="mt-1 text-sm text-gray-500">Latest biometric collections and verifications.</p>

            <div className="mt-4 bg-white shadow overflow-hidden rounded-md">
              <ul className="divide-y divide-gray-200">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <li key={activity.id}>
                      <a href={activity.href} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <User className="h-5 w-5 text-gray-400 mr-2" />
                              <p className="text-sm font-medium text-indigo-600 truncate">{activity.user}</p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                                {activity.status}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex flex items-center">
                              <Icon className={`h-4 w-4 mr-1 ${activity.color}`} />
                              <p className="text-sm text-gray-500">
                                {activity.type}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>{activity.time}</p>
                            </div>
                          </div>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;