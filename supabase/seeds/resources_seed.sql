-- Seed data for resources table

-- Study Jams
INSERT INTO resources (title, description, type, category, duration, level, status, materials, icon, color, order_index) VALUES
('Android Development Fundamentals', 'Complete guide to building Android apps with Kotlin', 'study_jam', 'Android', '8 weeks', 'Beginner', 'Available', ARRAY['Slides', 'Code Samples', 'Recordings'], 'Smartphone', 'text-green-600', 1),
('Google Cloud Platform Essentials', 'Learn cloud computing with hands-on GCP projects', 'study_jam', 'Cloud', '6 weeks', 'Intermediate', 'Available', ARRAY['Slides', 'Lab Guides', 'Recordings'], 'Cloud', 'text-blue-600', 2),
('Machine Learning with TensorFlow', 'Introduction to ML concepts and practical implementation', 'study_jam', 'ML', '10 weeks', 'Intermediate', 'Coming Soon', ARRAY['Slides', 'Notebooks', 'Datasets'], 'Brain', 'text-red-600', 3),
('Web Development with React', 'Modern web development using React and TypeScript', 'study_jam', 'Web', '8 weeks', 'Beginner', 'Available', ARRAY['Slides', 'Code Samples', 'Recordings'], 'Code', 'text-yellow-600', 4);

-- Cloud Credits
INSERT INTO resources (title, description, type, provider, amount, duration, requirements, url, order_index) VALUES
('Google Cloud Credits for Students', '$300 in free credits for new Google Cloud users', 'cloud_credit', 'Google Cloud', '$300', '12 months', ARRAY['Valid student email', 'First-time GCP user'], 'https://cloud.google.com/edu', 1),
('Firebase Spark Plan', 'Free tier for Firebase projects with generous limits', 'cloud_credit', 'Firebase', 'Free', 'Ongoing', ARRAY['Google account'], 'https://firebase.google.com/pricing', 2),
('GitHub Student Developer Pack', 'Free access to developer tools and cloud services', 'cloud_credit', 'GitHub', 'Various', 'While student', ARRAY['Valid student status'], 'https://education.github.com/pack', 3);

-- Documentation
INSERT INTO resources (title, description, type, tags, url, order_index) VALUES
('Android Developer Guides', 'Official Android development documentation', 'documentation', ARRAY['Android', 'Mobile', 'Kotlin'], 'https://developer.android.com/guide', 1),
('Google Cloud Documentation', 'Comprehensive guides for all GCP services', 'documentation', ARRAY['Cloud', 'Infrastructure', 'APIs'], 'https://cloud.google.com/docs', 2),
('TensorFlow Tutorials', 'Step-by-step machine learning tutorials', 'documentation', ARRAY['ML', 'AI', 'Python'], 'https://www.tensorflow.org/tutorials', 3),
('Flutter Documentation', 'Build beautiful cross-platform apps', 'documentation', ARRAY['Flutter', 'Mobile', 'Cross-platform'], 'https://docs.flutter.dev', 4);

-- Recordings
INSERT INTO resources (title, description, type, speaker, duration, views, url, order_index, metadata) VALUES
('Getting Started with Android Development', 'Learn the fundamentals of Android development using Kotlin and Android Studio', 'recording', 'Alex Chen', '1h 30m', 245, 'https://youtube.com/watch?v=example1', 1, '{"date": "2024-03-15"}'),
('Cloud Architecture Best Practices', 'Industry experts discuss cloud architecture patterns and best practices', 'recording', 'Sarah Johnson', '45m', 189, 'https://youtube.com/watch?v=example2', 2, '{"date": "2024-03-08"}'),
('Introduction to Machine Learning', 'Comprehensive introduction to machine learning concepts and applications', 'recording', 'Dr. Amanda Foster', '2h 15m', 312, 'https://youtube.com/watch?v=example3', 3, '{"date": "2024-02-28"}'),
('Building Responsive Web Apps', 'Modern techniques for building responsive and performant web applications', 'recording', 'Michael Rodriguez', '1h 45m', 156, 'https://youtube.com/watch?v=example4', 4, '{"date": "2024-02-20"}');