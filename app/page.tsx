'use client';

import Link from 'next/link'
import Header from '@/components/Header'
import TeamSlider from '@/components/TeamSlider'
import { Lock, Upload, Shield, BarChart3, Users, GraduationCap, FileText } from 'lucide-react'

export default function Home() {
  const features = [
    {
      name: 'Secure Storage',
      description: 'All biometric data is encrypted using AES-256 encryption before storage to ensure maximum security.',
      icon: Lock,
    },
    {
      name: 'Data Portability',
      description: 'Export your biometric data in multiple formats (JSON, XML, ISO 19794) to use with other systems.',
      icon: Upload,
    },
    {
      name: 'Privacy Compliance',
      description: 'Designed with GDPR and privacy regulations in mind to protect user data rights.',
      icon: Shield,
    }
  ]

  const teamMembers = [
    { name: 'Wisdom Penuel Akpan', matricNumber: '20220294080', role: 'Team Lead' },
    { name: 'Hamzat Raqazaq Opeyemi', matricNumber: '20220294139', role: 'Fullstack Developer' },
    { name: 'Salami Rahmon Olamide', matricNumber: '20220294077', role: 'Backend Developer' },
    { name: 'Sabbath Imaobong Jacob', matricNumber: '20220294252', role: 'Frontend Developer' },
    { name: 'Daramola Oluwaboleroke Jeremiah', matricNumber: '20220294083', role: 'UI/UX Designer' },
    { name: 'Mubarak Olamilekan Bello', matricNumber: '20220294333', role: 'Database Specialist' },
    { name: 'Imaadudeen Abiodun Aina', matricNumber: '20220204001', role: 'Security Analyst' },
    { name: 'Taiwo Oluwapelumi Roland', matricNumber: '20220294191', role: 'Quality Assurance' },
    { name: 'Adenaya Daniel Oluwasemilore', matricNumber: '20230294021', role: 'Documentation Manager' },
    { name: 'Olusegun Abosede Victoria', matricNumber: '20220294146', role: 'System Analyst' },
    { name: 'Opeyeni Bunmi Adeyeniyi', matricNumber: '20220294066', role: 'DevOps Engineer' },
    { name: 'Doo Agnes Desmond', matricNumber: '20220294004', role: 'Project Coordinator' },
    { name: 'Olatunji Samuel Feranmi', matricNumber: '20220294167', role: 'Database Administrator' },
    { name: 'Abdulmalik Ibrahim Opeyemi', matricNumber: '20220294002', role: 'Security Specialist' },
    { name: 'Daramola Olawunmi Rasheedat', matricNumber: '20220294091', role: 'Frontend Developer' },
    { name: 'Usman Adetola Saka', matricNumber: '20220294342', role: 'Backend Developer' },
    { name: 'Abiodun Taiwo Caleb', matricNumber: '20220294017', role: 'Fullstack Developer' },
    { name: 'Onilede Femi Samuel', matricNumber: '20220294256', role: 'Tester' },
    { name: 'Adenuga Joshua Oluwasegun', matricNumber: '20220294006', role: 'System Architect' },
    { name: 'Oluwatosin Adesore Awogefa', matricNumber: '20220294227', role: 'Researcher' },
  ]

  const images = [
    'https://tasued.edu.ng/web/wp-content/uploads/2023/06/WhatsApp-Image-2023-06-16-at-19.40.54-1.jpeg',
    'https://tasued.edu.ng/web/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-12-at-12.54.28-4.jpeg',
    'https://tasued.edu.ng/web/wp-content/uploads/2023/06/WhatsApp-Image-2023-06-16-at-19.40.46.jpeg',
    'https://tasued.edu.ng/web/wp-content/uploads/2023/06/WhatsApp-Image-2023-06-20-at-00.44.30-1.jpeg',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center bg-no-repeat py-24 md:py-32"
        style={{ backgroundImage: `url(${images[0]})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/3 mb-8 md:mb-0 flex justify-center">
              <img
                src="https://tasued.edu.ng/web/wp-content/uploads/2023/03/logo3.png"
                alt="TASUED Logo"
                className="h-40 w-40 object-contain"
              />
            </div>
            <div className="md:w-2/3 text-center md:text-left text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                <span className="block">Tai Solarin University</span>
                <span className="block text-indigo-300 mt-2">of Education</span>
              </h1>
              <p className="mt-6 text-xl max-w-3xl">
                Biometric Data Collection and Management System
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/dashboard"
                  className="flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Access Dashboard
                </Link>
                <Link
                  href="/collect"
                  className="flex justify-center items-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm text-white bg-transparent hover:bg-white hover:text-gray-900 transition-colors"
                >
                  <Lock className="mr-2 h-5 w-5" />
                  Collect Biometrics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Secure Biometric Solutions
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Advanced biometric data collection and management for educational institutions
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="bg-gray-50 overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="px-6 py-8">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">{feature.name}</h3>
                    <p className="mt-2 text-base text-gray-500 text-center">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campus Images Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              TASUED Campus
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Our beautiful university campus and facilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {images.map((image, index) => (
              <div key={index} className="overflow-hidden rounded-lg shadow-lg">
                <img
                  src={image}
                  alt={`TASUED Campus ${index + 1}`}
                  className="w-full h-60 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Information */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                CSC 415 Net-Centric Computing Project
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                This biometric data collection system is a group project for CSC 415 Net-Centric Computing course.
                The system focuses on secure collection, storage, and management of biometric data for Tai Solarin
                University of Education.
              </p>
              <dl className="mt-10 space-y-10">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-lg font-medium text-gray-900">Course</dt>
                    <dd className="mt-2 text-base text-gray-500">
                      CSC 415 Net-Centric Computing
                    </dd>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-lg font-medium text-gray-900">Lecturer</dt>
                    <dd className="mt-2 text-base text-gray-500">
                      Dr. Ogunsanwo
                    </dd>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-lg font-medium text-gray-900">Project Type</dt>
                    <dd className="mt-2 text-base text-gray-500">
                      Fullstack Biometric Data System
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="relative">
                <img
                  src={images[1]}
                  alt="TASUED Academic Building"
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <TeamSlider teamMembers={teamMembers} />

      {/* Call to Action */}
      <div className="py-16 bg-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-indigo-200">
              Access the biometric system to start collecting and managing data securely.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 transition-colors"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Access Dashboard
              </Link>
              <Link
                href="/collect"
                className="flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-800 hover:bg-indigo-900 transition-colors"
              >
                <Lock className="mr-2 h-5 w-5" />
                Collect Data
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <img
                src="https://tasued.edu.ng/web/wp-content/uploads/2023/03/logo3.png"
                alt="TASUED Logo"
                className="h-12 w-12"
              />
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-base text-gray-400">
                &copy; {new Date().getFullYear()} Tai Solarin University of Education - CSC 415 Net-Centric Computing Project
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}