# NIELIT Tezpur EC Online Exam System

A modern, secure, and user-friendly online examination platform built with Next.js and Appwrite.

## 🚀 Features

### For Students
- **Secure Authentication**: Role-based login system
- **Exam Dashboard**: View available exams and their status
- **Real-time Testing**: Take exams with timer and auto-submission
- **Results & Analytics**: Detailed performance analysis
- **Certificate Generation**: Download certificates upon completion
- **Profile Management**: Update personal information

### For Administrators
- **Comprehensive Dashboard**: Overview of students, exams, and results
- **Exam Management**: Create, edit, and schedule exams
- **Question Bank**: Manage questions with multiple formats
- **Student Management**: Add, edit, and manage student accounts
- **Results Management**: Publish and analyze exam results
- **Notification System**: Send announcements to students
- **Data Export**: Export results in CSV/Excel formats

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Appwrite (Database, Authentication, Storage)
- **Animations**: Framer Motion
- **Icons**: Lucide React, React Icons
- **Data Processing**: PapaParse, XLSX, JSON2CSV
- **Security**: bcryptjs for password hashing

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Appwrite account and project

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-nextjs-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp example.env.local .env.local
   ```
   
   Fill in your Appwrite configuration in `.env.local`:
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   APPWRITE_API_KEY=your_api_key
   # ... other variables
   ```

4. **Appwrite Setup**
   - Create collections: `students`, `exams`, `questions`, `courses`, `results`, `responses`
   - Set up authentication rules
   - Configure storage buckets for file uploads

5. **Run the development server**
```bash
npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AdminLayout.jsx
│   ├── StudentLayout.jsx
│   ├── Navbar.jsx
│   ├── Modal.jsx
│   ├── Table.jsx
│   ├── LoadingSpinner.jsx
│   └── ErrorBoundary.jsx
├── hooks/              # Custom React hooks
│   └── useAuth.js
├── pages/              # Next.js pages
│   ├── admin/          # Admin dashboard pages
│   ├── student/        # Student dashboard pages
│   ├── api/            # API routes
│   ├── _app.js         # App wrapper
│   ├── index.jsx       # Landing page
│   └── login.jsx       # Authentication page
├── styles/             # Global styles
├── utils/              # Utility functions
│   ├── appwrite.js     # Appwrite configuration
│   └── auth.js         # Authentication utilities
└── online_exam_system.txt  # System documentation
```

## 🔐 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **Role-based Access**: Separate admin and student interfaces
- **Session Management**: Secure session handling
- **Input Validation**: Client and server-side validation
- **Error Boundaries**: Graceful error handling

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Dark Mode Support**: Built-in theme switching
- **Smooth Animations**: Framer Motion integration
- **Loading States**: Consistent loading indicators
- **Error Handling**: User-friendly error messages
- **Accessibility**: WCAG compliant components

## 📊 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run clean` - Clean build artifacts

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Similar to Vercel setup
- **Railway**: Container-based deployment
- **AWS/GCP**: Docker container deployment

## 🔧 Development Guidelines

### Code Style
- Use functional components with hooks
- Follow ESLint and Prettier configurations
- Write meaningful component and function names
- Add JSDoc comments for complex functions

### File Naming
- Components: PascalCase (e.g., `UserProfile.jsx`)
- Utilities: camelCase (e.g., `formatDate.js`)
- Pages: kebab-case (e.g., `user-profile.jsx`)

### State Management
- Use React hooks for local state
- Context API for global state (auth, theme)
- Avoid prop drilling with custom hooks

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure `.env.local` exists in root directory
   - Restart development server after changes

2. **Appwrite Connection Issues**
   - Verify project ID and endpoint
   - Check API key permissions
   - Ensure collections exist

3. **Build Errors**
   - Run `npm run clean` and reinstall dependencies
   - Check for TypeScript errors with `npm run type-check`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in `src/online_exam_system.txt`

## 🔄 Version History

- **v0.1.0** - Initial release with basic exam functionality
- **v0.2.0** - Added authentication and user management
- **v0.3.0** - Enhanced UI/UX and performance improvements

---

Built with ❤️ by NIELIT Tezpur EC Development Team
