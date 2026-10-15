# THPS Website Context Blueprint

*Auto-generated snapshot of site architecture, schemas, and content hierarchy.*

---

## File: /website/about.html

**Title:** About Tom Hendrick | Data-Driven Presentation Coach

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
- H1: Meet Tom Hendrick: Pioneering Data-Driven Public Speaking
- H3: Industry Recognition
- H2: Why Traditional Speech Coaching is Broken
- H3: The Shift to Speech Biometrics
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

**Headings:**
- None found

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

## File: /website/home.html

**Title:** Tom Hendrick - Data-Driven Public Speaking Training

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

**Headings:**
- H1: Stop Guessing. Start Measuring.
- H2: Overcome Stage Fright with Objective Speech Metrics
- H3: Actionable Voice Data vs. Subjective Feedback
- H3: The Vocal Mechanics Method
- H2: Choose Your Path to Mastery
- H3: Measured Practice
- H3: Professional Coaching
- H3: Group Practice
- H2: Improve Your Communication Skills with the Mic-Check App
- H3: Monitor Pace, Pauses, and Vocal Variety in Real-Time
- H3: Practice with Guided Daily Training Courses
- H2: Proven Results for Corporate Professionals
- H3: See How Data Transforms Delivery
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

**Title:** Mic-Check App | AI Public Speaking Telemetry

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
      "description": "A live acoustic telemetry and NLP dashboard that scores public speaking metrics including WPM, Syllables per second, and visual vocabulary."
    }
```

**Schema 3:**
```json
{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "What is the Green Score?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Counts how many of the 9 metrics hit the perfect Green Zone (+10). Each green metric adds +1 to this score. Getting all 9 greens awards a +1 bonus, for a perfect 10/10."
        }
      }, {
        "@type": "Question",
        "name": "What is a good Speaking Pace (Words/min)?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Your speaking pace is critical to being understood. The sweet spot (Green Zone) is 100-150 words per minute."
        }
      }, {
        "@type": "Question",
        "name": "What does Runtime mean in public speaking?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Runtime is the average seconds you speak continuously before taking a meaningful pause. The optimal target is between 3.0 and 6.0 seconds."
        }
      }]
    }
```

**Headings:**
- H1: The Trackman for Public Speaking
- H2: Track Your History & Save Your Progress
- H2: How the Mic-Check App Scores Your Speech
- H3: Content (What You Say)
- H3: Delivery (How You Sound)
- H3: Simplicity (How Easily You Are Understood)
- H2: Frequently Asked Questions

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

**Title:** THPS Performance Plan | 4-Week Public Speaking Coaching

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
- H1: Transform Your Delivery in 4 Weeks
- H2: You Don't Have a Skill Acquisition Problem. You Have a Skill Inhibition Problem.
- H2: The 4-Week Path to Effortless Delivery
- H3: Breaking Inhibition & Building Constraints
- H3: Self-Regulation & Co-Regulation
- H3: Mastering Word Association
- H3: Effortless Delivery Under Pressure
- H3: Flexible Delivery Modes
- H3: Unlock the Performance Plan

---

## File: /website/services/thps-speech-assessment.html

**Title:** Free THPS Speech Assessment | Data-Driven Communication Diagnostic

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
            "price": "0",
            "priceCurrency": "AUD"
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
            "priceCurrency": "AUD"
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
- H1: Stop Guessing. Start Measuring.
- H3: The SAMS Test (Sympathetic Adreno-medullary System)
- H3: The VVIQ (Vividness of Visual Imagery Questionnaire)
- H3: The Vocal Inhibition Test
- H3: The Image-Based Speaking Test
- H3: The Rules-Based Speaking Test
- H3: Your Blueprint for Effortless Speaking
- H3: Ready to Map Your Metrics?

---

