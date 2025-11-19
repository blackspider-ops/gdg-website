-- Sample Blog Data for GDG Website
-- Run this script to populate your blog with sample posts and categories

-- First, let's create some blog categories (skip if they already exist)
INSERT INTO blog_categories (name, slug, description, color, is_active, order_index) 
SELECT 'Technology', 'technology', 'Latest tech trends and tutorials', '#3B82F6', true, 1
WHERE NOT EXISTS (SELECT 1 FROM blog_categories WHERE name = 'Technology')
UNION ALL
SELECT 'Web Development', 'web-development', 'Frontend and backend development tips', '#10B981', true, 2
WHERE NOT EXISTS (SELECT 1 FROM blog_categories WHERE name = 'Web Development')
UNION ALL
SELECT 'Mobile Development', 'mobile-development', 'Android and iOS development guides', '#F59E0B', true, 3
WHERE NOT EXISTS (SELECT 1 FROM blog_categories WHERE name = 'Mobile Development')
UNION ALL
SELECT 'Machine Learning', 'machine-learning', 'AI and ML tutorials and insights', '#8B5CF6', true, 4
WHERE NOT EXISTS (SELECT 1 FROM blog_categories WHERE name = 'Machine Learning')
UNION ALL
SELECT 'Cloud Computing', 'cloud-computing', 'Google Cloud Platform and other cloud services', '#EF4444', true, 5
WHERE NOT EXISTS (SELECT 1 FROM blog_categories WHERE name = 'Cloud Computing')
UNION ALL
SELECT 'Community', 'community', 'GDG events and community highlights', '#06B6D4', true, 6
WHERE NOT EXISTS (SELECT 1 FROM blog_categories WHERE name = 'Community');

-- Featured Post
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE title = 'Getting Started with Google Cloud for Students') THEN
        INSERT INTO blog_posts (
            title, 
            slug, 
            excerpt, 
            content, 
            author_name, 
            author_email, 
            tags, 
            status, 
            is_featured, 
            read_time_minutes, 
            views_count, 
            likes_count, 
            published_at
        ) VALUES (
            'Getting Started with Google Cloud for Students',
            'getting-started-with-google-cloud-for-students',
            'Learn how to leverage Google Cloud Platform with student credits and build scalable applications that can handle real-world traffic.',
            '# Getting Started with Google Cloud for Students

Google Cloud Platform (GCP) offers incredible opportunities for students to learn cloud computing and build scalable applications. With generous student credits and a comprehensive suite of services, it''s the perfect platform to start your cloud journey.

## What You''ll Learn

In this comprehensive guide, we''ll cover:

- Setting up your Google Cloud account with student credits
- Understanding core GCP services
- Building your first cloud application
- Best practices for cost optimization
- Security fundamentals

## Getting Your Student Credits

Google Cloud offers $300 in free credits for new users, plus additional educational credits through various programs:

### Google for Education Program
- Up to $100 in additional credits
- Access to specialized educational resources
- Priority support for student projects

### GitHub Student Developer Pack
- Additional cloud credits
- Access to premium developer tools
- Extended trial periods for various services

## Core Services to Master

### Compute Engine
Virtual machines that scale with your needs. Perfect for:
- Web applications
- Development environments
- Data processing tasks

```bash
# Create a simple VM instance
gcloud compute instances create my-instance \
    --zone=us-central1-a \
    --machine-type=e2-micro \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud
```

### App Engine
Serverless platform for web applications:
- Automatic scaling
- Built-in security
- Multiple language support

### Cloud Storage
Object storage for any amount of data:
- 99.999999999% durability
- Global accessibility
- Cost-effective storage classes

## Building Your First Application

Let''s create a simple web application using App Engine:

### Step 1: Set Up Your Environment
```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Step 2: Create Your Application
```python
# main.py
from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello, Google Cloud!"

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
```

### Step 3: Configure Deployment
```yaml
# app.yaml
runtime: python39

env_variables:
  FLASK_ENV: production
```

### Step 4: Deploy
```bash
gcloud app deploy
```

## Cost Optimization Tips

1. **Use the Free Tier**: Many services have generous free tiers
2. **Monitor Usage**: Set up billing alerts
3. **Choose Right Instance Types**: e2-micro for development
4. **Clean Up Resources**: Delete unused instances and storage

## Security Best Practices

### Identity and Access Management (IAM)
- Use principle of least privilege
- Create service accounts for applications
- Enable two-factor authentication

### Network Security
- Configure firewall rules
- Use VPC for network isolation
- Enable Cloud Armor for DDoS protection

## Next Steps

Once you''re comfortable with the basics:

1. **Explore Kubernetes Engine** for container orchestration
2. **Try Cloud Functions** for serverless computing
3. **Learn BigQuery** for data analytics
4. **Experiment with AI/ML APIs**

## Resources for Continued Learning

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Qwiklabs](https://www.qwiklabs.com/) for hands-on practice
- [Google Cloud Community](https://cloud.google.com/community)
- Local GDG events and workshops

## Conclusion

Google Cloud Platform provides an excellent foundation for learning cloud computing. With student credits and comprehensive documentation, you can build real-world applications while developing valuable skills for your career.

Start small, experiment often, and don''t be afraid to break things – that''s how you learn! Join our local GDG chapter for workshops, networking, and hands-on learning opportunities.

---

*Have questions about Google Cloud? Join our next workshop or reach out to our community on Discord!*',
            'Sarah Chen',
            'sarah.chen@gdg.dev',
            ARRAY['Cloud', 'Beginner', 'GCP', 'Students', 'Tutorial'],
            'published',
            true,
            8,
            245,
            23,
            NOW() - INTERVAL '2 days'
        );
    END IF;
END $$;

-- Android Accessibility Post
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE title = 'Building Accessible Android Apps: A Complete Guide') THEN
        INSERT INTO blog_posts (
            title, 
            slug, 
            excerpt, 
            content, 
            author_name, 
            author_email, 
            tags, 
            status, 
            is_featured, 
            read_time_minutes, 
            views_count, 
            likes_count, 
            published_at
        ) VALUES (
            'Building Accessible Android Apps: A Complete Guide',
            'building-accessible-android-apps-complete-guide',
            'Best practices for creating inclusive mobile experiences that work for everyone, including users with disabilities.',
            '# Building Accessible Android Apps: A Complete Guide

Accessibility in mobile apps isn''t just a nice-to-have feature – it''s essential for creating inclusive experiences that work for everyone. With over 1 billion people worldwide living with disabilities, accessible design opens your app to a much larger audience.

## Why Accessibility Matters

### The Business Case
- **Larger market reach**: 15% of the global population has some form of disability
- **Better user experience**: Accessible apps are easier for everyone to use
- **Legal compliance**: Many countries require digital accessibility
- **SEO benefits**: Accessible apps often rank better in app stores

### The Human Case
Creating accessible apps means ensuring that people with:
- Visual impairments can navigate your app with screen readers
- Motor disabilities can interact with touch targets
- Hearing impairments can access audio content
- Cognitive disabilities can understand your interface

## Android Accessibility Framework

Android provides robust accessibility APIs through the **AccessibilityService** framework:

### Core Components
1. **AccessibilityNodeInfo**: Represents UI elements
2. **AccessibilityEvent**: Describes user interactions
3. **AccessibilityService**: Processes accessibility events
4. **TalkBack**: Android''s built-in screen reader

## Essential Accessibility Principles

### 1. Content Descriptions
Every meaningful UI element should have a content description:

```kotlin
// In XML
<ImageButton
    android:id="@+id/playButton"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:src="@drawable/ic_play"
    android:contentDescription="@string/play_button_description" />

// In code
playButton.contentDescription = getString(R.string.play_button_description)
```

### 2. Touch Target Sizes
Ensure touch targets are at least 48dp × 48dp:

```xml
<Button
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:minWidth="48dp"
    android:minHeight="48dp"
    android:text="Submit" />
```

## Conclusion

Building accessible Android apps requires thoughtful design and implementation, but the impact is tremendous. By following these guidelines and testing thoroughly, you can create apps that truly work for everyone.

Remember: accessibility is not a one-time task but an ongoing commitment to inclusive design. Start with the basics, test regularly, and always consider the diverse needs of your users.

---

*Want to learn more about Android accessibility? Join our upcoming workshop on inclusive mobile design!*',
            'Michael Rodriguez',
            'michael.rodriguez@gdg.dev',
            ARRAY['Android', 'Accessibility', 'Mobile', 'UX', 'Inclusive Design'],
            'published',
            false,
            12,
            189,
            31,
            NOW() - INTERVAL '5 days'
        );
    END IF;
END $$;

-- Machine Learning Post
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE title = 'Machine Learning Study Jam: TensorFlow Fundamentals') THEN
        INSERT INTO blog_posts (
            title, 
            slug, 
            excerpt, 
            content, 
            author_name, 
            author_email, 
            tags, 
            status, 
            is_featured, 
            read_time_minutes, 
            views_count, 
            likes_count, 
            published_at
        ) VALUES (
            'Machine Learning Study Jam: TensorFlow Fundamentals',
            'machine-learning-study-jam-tensorflow-fundamentals',
            'Highlights from our recent ML workshop series covering TensorFlow basics and practical applications for beginners.',
            '# Machine Learning Study Jam: TensorFlow Fundamentals

Last week, our GDG chapter hosted an intensive Machine Learning Study Jam focused on TensorFlow fundamentals. With over 50 participants ranging from complete beginners to experienced developers, it was an incredible learning experience for everyone involved.

## Workshop Overview

Our 3-day intensive covered:
- **Day 1**: ML concepts and TensorFlow basics
- **Day 2**: Building your first neural network
- **Day 3**: Real-world project implementation

## Key Takeaways

### What is TensorFlow?
TensorFlow is Google''s open-source machine learning framework that makes it easy to build and deploy ML models. Here''s what makes it special:

- **Flexibility**: Works across platforms (mobile, web, cloud)
- **Scalability**: From research to production
- **Community**: Massive ecosystem and support
- **Integration**: Seamless with Google Cloud services

### Getting Started with TensorFlow

#### Installation
```bash
# For CPU-only version
pip install tensorflow

# For GPU support (requires CUDA)
pip install tensorflow-gpu

# Verify installation
python -c "import tensorflow as tf; print(tf.__version__)"
```

#### Your First TensorFlow Program
```python
import tensorflow as tf
import numpy as np

# Create a simple linear model
model = tf.keras.Sequential([
    tf.keras.layers.Dense(1, input_shape=[1])
])

# Compile the model
model.compile(optimizer=''sgd'', loss=''mean_squared_error'')

# Training data
xs = np.array([-1.0, 0.0, 1.0, 2.0, 3.0, 4.0], dtype=float)
ys = np.array([-3.0, -1.0, 1.0, 3.0, 5.0, 7.0], dtype=float)

# Train the model
model.fit(xs, ys, epochs=500, verbose=0)

# Make a prediction
print(model.predict([10.0]))  # Should be close to 19.0
```

## Conclusion

The Machine Learning Study Jam was a huge success, demonstrating that with the right approach, ML concepts can be accessible to everyone. TensorFlow''s user-friendly APIs and extensive documentation make it an excellent choice for beginners.

Whether you''re a student, developer, or just curious about AI, there''s never been a better time to start learning machine learning. The tools are mature, the community is supportive, and the applications are limitless.

---

*Missed the workshop? Don''t worry! All materials are available on our GitHub, and we''ll be running it again next quarter. Stay tuned for announcements!*',
            'Emily Johnson',
            'emily.johnson@gdg.dev',
            ARRAY['ML', 'TensorFlow', 'Workshop', 'AI', 'Python', 'Study Jam'],
            'published',
            false,
            10,
            156,
            18,
            NOW() - INTERVAL '1 week'
        );
    END IF;
END $$;

-- Web Development Trends Post
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE title = 'The Future of Web Development: Trends to Watch in 2025') THEN
        INSERT INTO blog_posts (
            title, 
            slug, 
            excerpt, 
            content, 
            author_name, 
            author_email, 
            tags, 
            status, 
            is_featured, 
            read_time_minutes, 
            views_count, 
            likes_count, 
            published_at
        ) VALUES (
            'The Future of Web Development: Trends to Watch in 2025',
            'future-of-web-development-trends-2025',
            'Exploring emerging trends in frontend frameworks, serverless architecture, and their impact on developer experience.',
            '# The Future of Web Development: Trends to Watch in 2025

Web development continues to evolve at breakneck speed. As we move through 2025, several key trends are reshaping how we build, deploy, and maintain web applications. Let''s explore the technologies and practices that are defining the future of web development.

## 1. The Rise of Meta-Frameworks

### Beyond Basic React and Vue
While React and Vue remain popular, meta-frameworks are taking center stage:

#### Next.js Evolution
- **App Router**: File-system based routing with layouts
- **Server Components**: Rendering on the server by default
- **Streaming**: Progressive page loading
- **Edge Runtime**: Deploy closer to users

```jsx
// Next.js 14 App Router example
// app/blog/[slug]/page.tsx
export default async function BlogPost({ params }) {
  const post = await getBlogPost(params.slug);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}
```

## 2. AI-Powered Development Tools

### Code Generation and Assistance
AI is transforming how we write code:

#### GitHub Copilot and Beyond
- **Context-aware suggestions**: Understanding your codebase
- **Test generation**: Automatic unit test creation
- **Documentation**: AI-generated comments and docs
- **Code review**: Automated security and performance checks

## Conclusion

The future of web development is exciting and full of opportunities. From AI-powered development tools to edge computing and sustainable practices, the landscape is evolving rapidly.

The key to staying relevant is continuous learning and experimentation. Don''t try to master everything at once – pick one or two trends that align with your interests and dive deep.

Remember: the fundamentals of good web development – performance, accessibility, security, and user experience – remain constant even as the tools evolve.

---

*What trends are you most excited about? Join the discussion at our next GDG meetup where we''ll be exploring these technologies hands-on!*',
            'David Kim',
            'david.kim@gdg.dev',
            ARRAY['Web Development', 'Frontend', 'Trends', 'JavaScript', 'React', 'Future Tech'],
            'published',
            false,
            15,
            203,
            27,
            NOW() - INTERVAL '3 days'
        );
    END IF;
END $$;

-- Kotlin Multiplatform Post
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE title = 'Kotlin Multiplatform: Write Once, Run Everywhere') THEN
        INSERT INTO blog_posts (
            title, 
            slug, 
            excerpt, 
            content, 
            author_name, 
            author_email, 
            tags, 
            status, 
            is_featured, 
            read_time_minutes, 
            views_count, 
            likes_count, 
            published_at
        ) VALUES (
            'Kotlin Multiplatform: Write Once, Run Everywhere',
            'kotlin-multiplatform-write-once-run-everywhere',
            'Discover how Kotlin Multiplatform is revolutionizing cross-platform development with shared business logic and native UI.',
            '# Kotlin Multiplatform: Write Once, Run Everywhere

Kotlin Multiplatform (KMP) is changing the game for cross-platform development. Unlike other solutions that compromise on performance or user experience, KMP allows you to share business logic while keeping native UI, giving you the best of both worlds.

## What is Kotlin Multiplatform?

Kotlin Multiplatform lets you share code between different platforms while maintaining the native look and feel of each platform. You can target:

- **Android** (native)
- **iOS** (native)
- **Web** (JavaScript/WASM)
- **Desktop** (JVM)
- **Server** (JVM/Native)

### Key Benefits
- **Code Reuse**: Share business logic, networking, and data models
- **Native Performance**: No performance penalties
- **Platform-Specific UI**: Native look and feel on each platform
- **Gradual Adoption**: Integrate incrementally into existing projects

## Getting Started with KMP

### Project Setup
```kotlin
// build.gradle.kts (project level)
plugins {
    kotlin("multiplatform") version "1.9.22"
    kotlin("native.cocoapods") version "1.9.22"
}

kotlin {
    androidTarget()
    
    iosX64()
    iosArm64()
    iosSimulatorArm64()
    
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
                implementation("io.ktor:ktor-client-core:2.3.7")
            }
        }
    }
}
```

## Conclusion

Kotlin Multiplatform offers a compelling solution for cross-platform development. By sharing business logic while maintaining native UI, you get the benefits of code reuse without sacrificing user experience.

Key takeaways:
- **Start Small**: Begin with data models and networking
- **Gradual Migration**: Integrate KMP incrementally
- **Platform Strengths**: Leverage each platform''s unique capabilities
- **Shared Testing**: Write tests once, run everywhere

The ecosystem is rapidly maturing, with excellent tooling support and growing adoption by major companies. Now is a great time to explore KMP for your next project.

---

*Interested in learning more about Kotlin Multiplatform? Join our upcoming workshop where we''ll build a complete KMP application from scratch!*',
            'Alex Thompson',
            'alex.thompson@gdg.dev',
            ARRAY['Kotlin', 'Multiplatform', 'Cross-platform', 'Mobile', 'KMP', 'Android', 'iOS'],
            'published',
            false,
            18,
            134,
            22,
            NOW() - INTERVAL '4 days'
        );
    END IF;
END $$;