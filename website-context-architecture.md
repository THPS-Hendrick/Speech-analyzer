# THPS Website Architecture Blueprint
*Auto-generated snapshot of site schemas and hierarchy.*

---

## File: /website/about.html

**Title:** Top-Rated Online Public Speaking Coach | Tom Hendrick

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Suite 110, 147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      }
    }
```

**Headings:**
- H1: Meet Tom Hendrick: Top-Rated Online Public Speaking Coach
- H3: Recognized as a Top 10 Speech Coach in AUS & NZ
- H2: Replacing Subjective Coaching with the Vocal Mechanics Method
- H3: The Shift to Objective Biometrics
- H2: The Origin of the Mic-Check App

---

## File: /website/articles/case-studies.html

**Title:** Case Study: Optimizing Executive Pace to 150 WPM | Tom Hendrick

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Suite 110, 147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      }
    }
```

**Schema 2:**
```json
{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": "https://tomhendrick.com/articles/case-study-pacing.html#article",
          "headline": "How an Executive Optimized Speaking Pace Under Pressure to 150 WPM",
          "description": "A data-driven case study detailing how an executive optimized speaking tempo from 180 WPM to 150 WPM using acoustic telemetry and the Vocal Mechanics Method.",
          "author": {
            "@type": "Person",
            "@id": "https://tomhendrick.com/about.html#author",
            "name": "Tom Hendrick",
            "jobTitle": "Speech Biomechanics Specialist & Public Speaking Coach",
            "url": "https://tomhendrick.com/about.html",
            "sameAs": [
              "https://www.linkedin.com/in/tomhendrick-publicspeaking"
            ]
          },
          "publisher": {
            "@type": "Organization",
            "name": "Tom Hendrick Public Speaking",
            "logo": {
              "@type": "ImageObject",
              "url": "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/image/thps-logo-tom-hendrick-public-speaking.svg"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "https://tomhendrick.com/articles/case-study-pacing.html"
          }
        },
        {
          "@type": "SoftwareApplication",
          "@id": "https://tomhendrick.com/services/mic-check-app.html#software",
          "name": "Mic-Check Speech Analyzer",
          "operatingSystem": "Web-Based Browser App",
          "applicationCategory": "EducationalApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        },
        {
          "@type": "AggregateRating",
          "@id": "https://tomhendrick.com/#rating",
          "itemReviewed": {
            "@type": "LocalBusiness",
            "name": "Tom Hendrick Public Speaking"
          },
          "ratingValue": "5.0",
          "reviewCount": "24",
          "bestRating": "5"
        }
      ]
    }
```

**Headings:**
- H1: How an Executive Optimized Speaking Pace Under Pressure to 150 WPM
- H2: Executive Summary / TL;DR
- H3: Interactive Tool: Test Your Speech Mechanics
- H2: The Baseline Challenge: Racing the Clock
- H2: The Diagnostic: Establishing the Data
- H2: The Intervention: The THPS Performance Plan
- H2: The Final Result: Composure and Command
- H3: How the Mic-Check Scorer Engine Measures Your Spoken Voice
- H3: Stop Guessing. Start Measuring.

---

## File: /website/articles/glossary.html

**Title:** Public Speaking Glossary & Metrics Directory | Tom Hendrick

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Suite 110, 147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      }
    }
```

**Schema 2:**
```json
{
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      "@id": "https://tomhendrick.com/articles/glossary.html#termset",
      "name": "THPS Public Speaking & Speech Biometrics Glossary",
      "description": "Master terminology dictionary for speech biometrics, objective presentation metrics, and vocal diagnostic tools.",
      "hasDefinedTerm": [
        {
          "@type": "DefinedTerm",
          "name": "THPS Speech Assessment",
          "description": "A free, 1-hour, 5-step data-driven diagnostic session used to measure presentation anxiety, unscripted fluency, and vocal inhibition."
        },
        {
          "@type": "DefinedTerm",
          "name": "THPS Performance Plan",
          "description": "A premium 4-week, 1-on-1 intensive coaching program ($990 AUD) designed to move executives from cognitive strain to effortless delivery."
        },
        {
          "@type": "DefinedTerm",
          "name": "Mic-Check App",
          "description": "A web browser-based educational application able to process live and recorded audio data into natural language displayed on a dashboard of insightful speaking metrics."
        },
        {
          "@type": "DefinedTerm",
          "name": "WPM",
          "description": "Words Per Minute. Measures how many words the speaker says per minute on average. The ideal target range is between 100 to 150 WPM."
        },
        {
          "@type": "DefinedTerm",
          "name": "SPS",
          "description": "Syllables Per Second. Measures speaking speed excluding pauses to prevent mumbles. Target range is 3.5 to 4.5 syllables per second."
        }
      ]
    }
```

**Headings:**
- H1: THPS Glossary: Speech Biometrics & Delivery Metrics
- H2: Core Brand Entities & Coaching Programs
- H3: THPS
- H3: THPS Speech Assessment
- H3: THPS Performance Plan
- H3: Mic-Check App
- H3: Mic-Check Pro
- H3: Fun Fridays
- H2: Mic-Check App Delivery Metrics
- H3: Green Score
- H3: WPM
- H3: SPS
- H3: Pause %
- H3: Runtime
- H3: Noticeable Pause
- H3: Personal
- H3: Visual
- H3: Intangible
- H3: Comp-Grade
- H3: Simple %
- H2: Diagnostic Frameworks & Tests
- H3: Skill Inhibition
- H3: SAMS Test (Sympathetic Adreno-medullary System)
- H3: VVIQ (Vividness of Visual Imagery Questionnaire)
- H3: Vocal Inhibition Test
- H3: Image-Based Speaking Test
- H3: Rules-Based Speaking Test
- H2: Ready to Benchmark Your Speech Metrics?

---

## File: /website/articles/transformations-hub.html

**Title:** Data-Driven Public Speaking Transformations | Tom Hendrick

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Suite 110, 147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      }
    }
```

**Schema 2:**
```json
{
      "@context": "https://schema.org/",
      "@type": "LocalBusiness",
      "name": "Tom Hendrick Public Speaking",
      "image": "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/image/thps-logo-tom-hendrick-public-speaking.svg",
      "description": "Data-driven executive speech coaching and real-time vocal diagnostics via the Mic-Check App.",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "68"
      }
    }
```

**Headings:**
- H1: Data-Driven Public Speaking Transformations
- H3: Optimized Executive Pace to 150 WPM
- H3: Mastering Professional Pitching & Q&A
- H3: Hitting the 60% Visual Engagement Rule

---

## File: /website/contact.html

**Title:** Contact Tom Hendrick | Book Your Speech Assessment

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Suite 110, 147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      }
    }
```

**Headings:**
- H1: Start Your Data-Driven Communication Training
- H2: Book Your THPS Speech Assessment
- H2: Corporate Inquiries & Online Classes
- H3: Global Coaching from Adelaide
- H3: Message Sent!

---

## File: /website/index.html

**Title:** The Premier Online Public Speaking Coach | THPS

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick Public Speaking",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      }
    }
```

**Schema 2:**
```json
{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "What is a good words-per-minute pace for a business presentation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "According to Mic-Check data, the ideal pace for a corporate presentation is between 130 and 150 words per minute."
        }
      }]
    }
```

**Schema 3:**
```json
{
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": "Live Executive Coaching: Overcoming Skill Inhibition",
      "description": "Top-rated online public speaking coach Tom Hendrick uses live audio data from the Mic-Check App to help a corporate executive reduce their pacing to the optimal WPM zone.",
      "thumbnailUrl": "https://raw.githubusercontent.com/THPS-Hendrick/Speech-analyzer/main/website/image/thps-executive-coaching-online-mic-check-app-progress.webp",
      "uploadDate": "2026-10-19T08:00:00+08:00",
      "embedUrl": "https://www.youtube.com/embed/VHKt58SrD1Q"
    }
```

**Headings:**
- H1: The Premier Online Public Speaking Coach for Data-Driven Professionals
- H2: Why the Best Executives Train with Objective Speech Metrics
- H2: Online Coaching, Classes, and Software to Master Your Voice
- H3: Measured Practice
- H3: Professional Coaching
- H3: Group Practice
- H2: The Mic-Check App: A Launch Monitor for Public Speaking
- H3: Monitor Pace, Pauses, and Vocal Variety in Real-Time
- H3: Practice with Guided Daily Training Courses
- H2: Proven Results for Corporate Professionals
- H3: See How Data Transforms Delivery
- H3: Verified Reviews
- H2: Frequently Asked Questions About Business Presentation Training

---

## File: /website/members/account.html

**Title:** Account Management | THPS Member Portal

**Headings:**
- H1: Account Management
- H2: Profile Details
- H2: Billing & Plan
- H3: Mic-Check Pro
- H3: Billing History
- H2: Coaching Integration (CRM)
- H2: Legal & Session

---

## File: /website/members/login.html

**Title:** Log In or Sign Up | Mic-Check App by Tom Hendrick

**Headings:**
- H1: Log in or create an account
- H2: Unlock Mic-Check Pro for $9.90/mo

---

## File: /website/members/mic-check.html

**Headings:**
- None found

---

## File: /website/members/progress.html

**Headings:**
- None found

---

## File: /website/partials/footer.html

**Headings:**
- None found

---

## File: /website/partials/header.html

**Headings:**
- None found

---

## File: /website/services/mic-check-app.html

**Title:** Mic-Check App | AI Public Speaking Metrics

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick Public Speaking",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Suite 110, 147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      }
    }
```

**Schema 2:**
```json
{
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Mic-Check App",
      "operatingSystem": "Web Browser",
      "applicationCategory": "EducationalApplication",
      "offers": {
        "@type": "Offer",
        "price": "9.90",
        "priceCurrency": "AUD",
        "billingIncrement": "P1M"
      },
      "description": "The Mic-Check App is akin to a golf launch monitor for public speaking, as it is a web browser-based educational application able to process live and recorded audio data into natural language displayed on a dashboard of insightful speaking metrics."
    }
```

**Schema 3:**
```json
{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "What is the Score Summary?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Score Summary measures your Content, Delivery, and Simplicity. Metrics in the green zone get +10 points to formulate your total Grade out of 100."
        }
      }, {
        "@type": "Question",
        "name": "What is the Green Score?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Green Score counts how many of the 9 core metrics hit the perfect Green Zone (+10). Each green metric adds +1 to this score. Getting all 9 greens awards a +1 bonus, for a perfect 10/10."
        }
      }, {
        "@type": "Question",
        "name": "How is the final Grade calculated?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Your final Grade is a score out of 100. It is the sum of your 9 core metrics (max 90 points) plus your Green Score (max 10 points)."
        }
      }]
    }
```

**Headings:**
- H1: The Trackman for Public Speaking
- H2: How the Mic-Check App Scores Your Speech
- H2: Content (What You Say)
- H3: What is the Personal metric in public speaking?
- H3: What is the Visual metric in public speaking?
- H3: What is the Intangible metric in public speaking?
- H2: Delivery (How You Sound)
- H3: What is a good speaking pace (WPM)?
- H3: What is the Syllables Per Second (SPS) metric?
- H3: What is the ideal Pause % for a presentation?
- H3: How do variance metrics affect delivery?
- H2: Simplicity (How Easily You Are Understood)
- H3: What does Runtime mean in public speaking?
- H3: What is a good Comp-Grade for speeches?
- H3: What is the Simple % metric?
- H2: Frequently Asked Questions
- H2: Track Your History & Save Your Progress

---

## File: /website/services/online-classes.html

**Title:** Free Online Public Speaking Classes | THPS Fun Fridays

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick Public Speaking",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Suite 110, 147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      }
    }
```

**Schema 2:**
```json
{
      "@context": "https://schema.org",
      "@type": "EducationEvent",
      "name": "THPS Fun Fridays: Online Public Speaking Class",
      "description": "A free, weekly interactive group practice session combining improv mechanics with live acoustic telemetry feedback using the Mic-Check App.",
      "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
      "eventSchedule": {
        "@type": "Schedule",
        "byDay": "https://schema.org/Friday",
        "scheduleTimezone": "Australia/Adelaide"
      },
      "location": {
        "@type": "VirtualLocation",
        "url": "https://tomhendrick.com/services/online-classes.html"
      },
      "organizer": {
        "@type": "Person",
        "name": "Tom Hendrick",
        "url": "https://tomhendrick.com/about.html"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "AUD",
        "availability": "https://schema.org/InStock"
      }
    }
```

**Headings:**
- H1: Your Weekly Public Speaking Workout
- H2: Fun Fridays
- H3: Live Class RSVP
- H3: Select Upcoming Classes
- H3: Confirm Your Spots
- H3: You're on the lists!
- H2: The Class Menu: What We Do Every Friday
- H3: Thinking on Your Feet
- H3: Measured Accountability
- H3: De-Inhibiting the Voice
- H3: Visualizing Transformation
- H3: Ready to Join the Community?

---

## File: /website/services/services.html

**Title:** Public Speaking Services & Coaching | Tom Hendrick

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick Public Speaking",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Suite 110, 147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "24",
        "bestRating": "5"
      }
    }
```

**Schema 2:**
```json
{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "How do I enroll in the THPS Performance Plan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Because the Performance Plan is highly tailored to your specific biomechanical and cognitive gaps, it cannot be purchased directly. All clients must first complete the Free 1-Hour THPS Speech Assessment to establish their baseline data."
        }
      }, {
        "@type": "Question",
        "name": "Do I need a paid subscription to try the Mic-Check App?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, you can test a free browser demo of the Mic-Check App immediately. The full version, which includes historical progress tracking, courses, and daily games, is $9 per month or $99 per year."
        }
      }, {
        "@type": "Question",
        "name": "When are the free online practice classes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We host a free online class every Friday at lunchtime. It is a low-pressure environment designed to help you practice your public speaking skills on camera."
        }
      }]
    }
```

**Headings:**
- H1: Many Paths to Improved Speaking Skills
- H3: Group Practice
- H3: Professional Coaching
- H3: Measured Practice
- H3: THPS Speech Assessment
- H3: Mic-Check App
- H3: THPS Performance Plan
- H3: Online Practice Classes
- H2: Frequently Asked Questions

---

## File: /website/services/thps-performance-plan.html

**Title:** The THPS Performance Plan | Premium Online Speech Coaching

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick Public Speaking",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Suite 110, 147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "24",
        "bestRating": "5"
      }
    }
```

**Schema 2:**
```json
{
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://tomhendrick.com/services/thps-performance-plan.html#service",
      "name": "THPS Performance Plan",
      "description": "A premium 4-week, 1-on-1 intensive public speaking coaching program designed to move executives from cognitive strain to autonomous, effortless delivery under pressure.",
      "provider": {
        "@type": "Person",
        "@id": "https://tomhendrick.com/about.html#author",
        "name": "Tom Hendrick",
        "jobTitle": "Speech Biomechanics Specialist & Public Speaking Coach",
        "url": "https://tomhendrick.com/about.html",
        "sameAs": [
          "https://www.linkedin.com/in/tomhendrick-publicspeaking"
        ]
      },
      "offers": {
        "@type": "Offer",
        "price": "990.00",
        "priceCurrency": "AUD",
        "availability": "https://schema.org/InStock"
      }
    }
```

**Headings:**
- H1: The THPS Performance Plan: Premium Online Speech Coaching
- H2: Overcome Skill Inhibition with Data-Driven Executive Training
- H2: A 4-Week Online Path to Effortless Delivery Under Pressure
- H3: Breaking Inhibition & Building Constraints
- H3: Self-Regulation & Co-Regulation
- H3: Mastering Word Association
- H3: Effortless Delivery Under Pressure
- H3: Flexible Delivery Modes
- H3: Unlock the Performance Plan

---

## File: /website/services/thps-speech-assessment.html

**Title:** Book Your Free THPS Speech Assessment | Tom Hendrick

**Schema 1:**
```json
{
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Tom Hendrick",
      "legalName": "Thomas Geoffrey Hendrick",
      "url": "https://tomhendrick.com",
      "telephone": "+61419499331",
      "vatID": "56949157639",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Suite 110, 147 Pirie Street",
        "addressLocality": "Adelaide",
        "addressRegion": "SA",
        "postalCode": "5000",
        "addressCountry": "AU"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-34.9252",
        "longitude": "138.6063"
      }
    }
```

**Schema 2:**
```json
{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          "@id": "https://tomhendrick.com/services/thps-speech-assessment.html#service",
          "name": "Free 1-Hour THPS Speech Assessment",
          "description": "A 5-step data-driven acoustic and cognitive diagnostic to measure presentation anxiety, unscripted fluency, and vocal inhibition.",
          "provider": {
            "@type": "Person",
            "name": "Tom Hendrick",
            "jobTitle": "Speech Biomechanics Specialist & Public Speaking Coach",
            "url": "https://tomhendrick.com/about.html"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "AUD"
          },
          "potentialAction": {
            "@type": "ReserveAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://tomhendrick.com/services/thps-speech-assessment.html",
              "inLanguage": "en-US",
              "actionPlatform": [
                "http://schema.org/DesktopWebPlatform",
                "http://schema.org/MobileWebPlatform"
              ]
            },
            "result": {
              "@type": "Reservation",
              "name": "THPS Speech Assessment Booking"
            }
          }
        },
        {
          "@type": "AggregateRating",
          "@id": "https://tomhendrick.com/#rating",
          "itemReviewed": {
            "@type": "LocalBusiness",
            "name": "Tom Hendrick Public Speaking"
          },
          "ratingValue": "5.0",
          "reviewCount": "24",
          "bestRating": "5"
        }
      ]
    }
```

**Headings:**
- H1: Book Your Free THPS Speech Assessment
- H2: Tom Hendrick
- H3: 1-Hour Diagnostic
- H3: Select Date
- H3: Available Times
- H3: Confirm Details
- H3: Booking Confirmed!
- H3: The SAMS Test (Sympathetic Adreno-medullary System)
- H3: The VVIQ (Vividness of Visual Imagery Questionnaire)
- H3: The Vocal Inhibition Test
- H3: The Image-Based Speaking Test
- H3: The Rules-Based Speaking Test
- H3: Your Blueprint for Effortless Speaking
- H3: Ready to Map Your Metrics?

---

