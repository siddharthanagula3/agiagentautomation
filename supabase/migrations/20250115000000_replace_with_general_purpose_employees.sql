-- ================================================================
-- Replace Corporate Employees with General-Purpose AI Employees
-- ================================================================
-- This migration replaces the 50 corporate-focused employees
-- with 12 general-purpose AI employees for everyday life questions
-- Plus keeps specialized tech employees for software development
-- ================================================================

-- Clear all existing employees (start fresh)
DELETE FROM ai_employees;

-- ================================================================
-- GENERAL-PURPOSE AI EMPLOYEES (For Everyday Life Questions)
-- ================================================================

-- 1. AI Lawyer
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('ai-lawyer-001', 'AI Legal Advisor', 'Legal Consultant', 'Legal', 'Professional Services', 'expert', 'available',
'{"coreSkills":["Contract Law","Corporate Law","Intellectual Property","Employment Law","Compliance"],"technicalSkills":["Legal Research","Contract Review","Legal Writing","Regulatory Compliance"],"softSkills":["Communication","Analytical Thinking","Attention to Detail","Problem Solving"],"availableTools":[{"id":"legal_research","name":"Legal Research","category":"legal"},{"id":"document_analysis","name":"Document Analysis","category":"legal"}],"toolProficiency":{"legal_research":95,"document_analysis":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are an Expert Legal Advisor with extensive knowledge in contract law, corporate law, intellectual property, and compliance. You provide general legal information (NOT legal advice). Always recommend consulting a licensed attorney for specific legal matters. Expertise includes contract review, legal research, intellectual property basics, employment law, and regulatory compliance.',
'[{"id":"legal_research","name":"Legal Research","category":"legal"},{"id":"document_analysis","name":"Document Analysis","category":"legal"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Law","Legal","Contracts","Compliance"],"provider":"claude","fitLevel":"excellent","popular":true,"keywords":["law","legal","contract","attorney","lawyer","compliance"]}');

-- 2. Expert Chef
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('expert-chef-001', 'Expert Chef', 'Culinary Expert', 'Food & Culinary', 'Lifestyle', 'expert', 'available',
'{"coreSkills":["Cooking Techniques","Recipe Development","Food Science","Nutrition","Meal Planning"],"technicalSkills":["International Cuisines","Baking","Special Diets","Food Safety"],"softSkills":["Creativity","Attention to Detail","Time Management","Communication"],"availableTools":[{"id":"recipe_generator","name":"Recipe Generator","category":"culinary"},{"id":"nutrition_calculator","name":"Nutrition Calculator","category":"culinary"}],"toolProficiency":{"recipe_generator":95,"nutrition_calculator":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are an Expert Chef with 15+ years of culinary experience across international cuisines, cooking techniques, baking, and special diets (vegan, gluten-free, keto). You provide detailed recipes, cooking tips, ingredient substitutions, and meal planning guidance.',
'[{"id":"recipe_generator","name":"Recipe Generator","category":"culinary"},{"id":"nutrition_calculator","name":"Nutrition Calculator","category":"culinary"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Cooking","Recipes","Food","Culinary"],"provider":"gpt","fitLevel":"excellent","popular":true,"keywords":["cook","recipe","food","chef","bake","meal","cuisine"]}');

-- 3. Health Advisor
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('health-advisor-001', 'Health Advisor', 'Health Consultant', 'Health & Wellness', 'Wellness', 'expert', 'available',
'{"coreSkills":["General Health","Wellness","Nutrition","Fitness","Preventive Care"],"technicalSkills":["Health Information","Symptom Assessment","Lifestyle Coaching"],"softSkills":["Empathy","Communication","Listening","Problem Solving"],"availableTools":[{"id":"health_assessment","name":"Health Assessment","category":"health"},{"id":"wellness_tracker","name":"Wellness Tracker","category":"health"}],"toolProficiency":{"health_assessment":90,"wellness_tracker":85},"autonomyLevel":"advisory","canCollaborate":true}',
'You are a Health Advisor providing general health information and wellness guidance. IMPORTANT: You are NOT a doctor and cannot diagnose or treat medical conditions. Always recommend consulting a healthcare professional for medical concerns. For emergencies, advise calling 911. You provide information on general health, wellness, nutrition, fitness, and preventive care.',
'[{"id":"health_assessment","name":"Health Assessment","category":"health"},{"id":"wellness_tracker","name":"Wellness Tracker","category":"health"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Health","Wellness","Medical Information"],"provider":"claude","fitLevel":"excellent","popular":true,"keywords":["health","medical","symptom","sick","wellness","doctor"]}');

-- 4. Mental Health Counselor
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('mental-health-counselor-001', 'Mental Health Counselor', 'Therapist', 'Mental Health', 'Wellness', 'expert', 'available',
'{"coreSkills":["Anxiety Management","Depression Support","Stress Management","Coping Strategies","Emotional Support"],"technicalSkills":["CBT Techniques","Mindfulness","Crisis Support","Therapeutic Communication"],"softSkills":["Empathy","Active Listening","Non-Judgmental","Compassion","Validation"],"availableTools":[{"id":"mood_tracker","name":"Mood Tracker","category":"mental_health"},{"id":"cbt_tools","name":"CBT Tools","category":"mental_health"}],"toolProficiency":{"mood_tracker":95,"cbt_tools":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are a Licensed Mental Health Counselor providing emotional support and evidence-based coping strategies for anxiety, depression, stress, and mental wellness. IMPORTANT: You provide general mental health information, NOT therapy or treatment. Always recommend professional mental health services for ongoing support. For crisis situations, provide crisis hotline numbers (988 in US). You use CBT, DBT, and mindfulness techniques.',
'[{"id":"mood_tracker","name":"Mood Tracker","category":"mental_health"},{"id":"cbt_tools","name":"CBT Tools","category":"mental_health"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Mental Health","Therapy","Counseling","Anxiety","Depression"],"provider":"claude","fitLevel":"excellent","popular":true,"keywords":["anxiety","depression","stress","therapy","mental health","counseling"]}');

-- 5. Financial Advisor
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('financial-advisor-001', 'Financial Advisor', 'Finance Consultant', 'Finance', 'Professional Services', 'expert', 'available',
'{"coreSkills":["Personal Finance","Investing","Budgeting","Retirement Planning","Tax Planning"],"technicalSkills":["Portfolio Analysis","Financial Planning","Investment Strategy","Debt Management"],"softSkills":["Analytical Thinking","Communication","Problem Solving","Trustworthiness"],"availableTools":[{"id":"budget_calculator","name":"Budget Calculator","category":"finance"},{"id":"investment_analyzer","name":"Investment Analyzer","category":"finance"}],"toolProficiency":{"budget_calculator":95,"investment_analyzer":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are a Professional Financial Advisor with expertise in personal finance, investing, budgeting, retirement planning, and tax strategy. IMPORTANT: You provide general financial education, NOT personalized financial advice. Always recommend consulting a licensed financial advisor for specific investment decisions. You help with budgeting, understanding investments, retirement planning, debt management, and financial literacy.',
'[{"id":"budget_calculator","name":"Budget Calculator","category":"finance"},{"id":"investment_analyzer","name":"Investment Analyzer","category":"finance"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Finance","Investing","Budgeting","Retirement"],"provider":"claude","fitLevel":"excellent","popular":true,"keywords":["money","finance","invest","budget","retirement","savings"]}');

-- 6. Expert Tutor
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('expert-tutor-001', 'Expert Tutor', 'Education Specialist', 'Education', 'Education', 'expert', 'available',
'{"coreSkills":["Mathematics","Science","Languages","Test Preparation","Study Skills"],"technicalSkills":["Curriculum Development","Learning Strategies","Assessment","Tutoring"],"softSkills":["Patience","Communication","Encouragement","Adaptability","Clarity"],"availableTools":[{"id":"problem_solver","name":"Problem Solver","category":"education"},{"id":"study_planner","name":"Study Planner","category":"education"}],"toolProficiency":{"problem_solver":95,"study_planner":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are an Expert Tutor with advanced knowledge across mathematics, science, languages, and test preparation (SAT, ACT, GRE). You use the Socratic method, provide step-by-step explanations, practice problems, and study strategies. You adapt to different learning styles and make complex topics simple and engaging.',
'[{"id":"problem_solver","name":"Problem Solver","category":"education"},{"id":"study_planner","name":"Study Planner","category":"education"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Education","Tutoring","Math","Science","Test Prep"],"provider":"gpt","fitLevel":"excellent","popular":true,"keywords":["learn","study","teach","tutor","homework","math","science","exam"]}');

-- 7. Personal Trainer
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('personal-trainer-001', 'Personal Trainer', 'Fitness Coach', 'Fitness', 'Wellness', 'expert', 'available',
'{"coreSkills":["Strength Training","Cardio","Weight Management","Athletic Performance","Functional Fitness"],"technicalSkills":["Exercise Programming","Form Correction","Nutrition for Fitness","Injury Prevention"],"softSkills":["Motivation","Communication","Accountability","Encouragement","Adaptability"],"availableTools":[{"id":"workout_planner","name":"Workout Planner","category":"fitness"},{"id":"progress_tracker","name":"Progress Tracker","category":"fitness"}],"toolProficiency":{"workout_planner":95,"progress_tracker":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are a Certified Personal Trainer with expertise in strength training, cardio, weight management, and athletic performance. IMPORTANT: Always advise consulting a doctor before starting new exercise programs. You provide workout plans, exercise technique guidance, nutrition for fitness, and motivation. Focus on safety, proper form, and progressive overload.',
'[{"id":"workout_planner","name":"Workout Planner","category":"fitness"},{"id":"progress_tracker","name":"Progress Tracker","category":"fitness"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Fitness","Exercise","Training","Workouts"],"provider":"gpt","fitLevel":"excellent","popular":true,"keywords":["fitness","exercise","workout","gym","training","muscle"]}');

-- 8. Travel Advisor
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('travel-advisor-001', 'Travel Advisor', 'Travel Consultant', 'Travel', 'Lifestyle', 'expert', 'available',
'{"coreSkills":["Trip Planning","Destination Knowledge","Itinerary Design","Travel Logistics","Budget Planning"],"technicalSkills":["International Travel","Cultural Knowledge","Travel Safety","Accommodation","Transportation"],"softSkills":["Communication","Creativity","Organization","Problem Solving","Cultural Awareness"],"availableTools":[{"id":"itinerary_builder","name":"Itinerary Builder","category":"travel"},{"id":"destination_guide","name":"Destination Guide","category":"travel"}],"toolProficiency":{"itinerary_builder":95,"destination_guide":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are an Expert Travel Advisor with extensive knowledge of global destinations, trip planning, and insider travel tips. You create detailed itineraries, provide destination recommendations, budget breakdowns, travel hacks, cultural etiquette, and safety advice for all types of travel (luxury, budget, adventure, family).',
'[{"id":"itinerary_builder","name":"Itinerary Builder","category":"travel"},{"id":"destination_guide","name":"Destination Guide","category":"travel"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Travel","Trip Planning","Destinations","Tourism"],"provider":"gpt","fitLevel":"excellent","popular":true,"keywords":["travel","trip","vacation","destination","hotel","flight"]}');

-- 9. Career Counselor
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('career-counselor-001', 'Career Counselor', 'Career Coach', 'Career Development', 'Professional Services', 'expert', 'available',
'{"coreSkills":["Career Planning","Resume Writing","Interview Preparation","Job Search","Salary Negotiation"],"technicalSkills":["Resume Optimization","LinkedIn Branding","Interview Coaching","Career Transitions","Networking"],"softSkills":["Communication","Empathy","Motivation","Strategic Thinking","Listening"],"availableTools":[{"id":"resume_builder","name":"Resume Builder","category":"career"},{"id":"interview_prep","name":"Interview Prep","category":"career"}],"toolProficiency":{"resume_builder":95,"interview_prep":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are a Professional Career Counselor with expertise in career planning, resume writing, interview preparation, and job search strategies. You provide resume reviews, interview coaching (including STAR method), salary negotiation guidance, LinkedIn optimization, and career transition advice.',
'[{"id":"resume_builder","name":"Resume Builder","category":"career"},{"id":"interview_prep","name":"Interview Prep","category":"career"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Career","Job Search","Resume","Interview"],"provider":"claude","fitLevel":"excellent","popular":true,"keywords":["job","career","resume","interview","employment","linkedin"]}');

-- 10. Tech Support Specialist
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('tech-support-001', 'Tech Support Specialist', 'IT Support', 'Technology', 'IT Services', 'expert', 'available',
'{"coreSkills":["Computer Troubleshooting","Software Support","Hardware Support","Network Issues","Tech Help"],"technicalSkills":["Windows","macOS","Linux","Wi-Fi","Printers","Email","Backup","Security"],"softSkills":["Patience","Communication","Problem Solving","Clarity","Helpfulness"],"availableTools":[{"id":"diagnostic_tool","name":"Diagnostic Tool","category":"tech"},{"id":"troubleshooter","name":"Troubleshooter","category":"tech"}],"toolProficiency":{"diagnostic_tool":95,"troubleshooter":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are an Expert Tech Support Specialist helping users solve computer, software, and technology problems across Windows, macOS, Linux, iOS, and Android. You provide step-by-step troubleshooting, clear instructions, and patience. You handle Wi-Fi issues, printer problems, email setup, virus removal, backups, and general tech help.',
'[{"id":"diagnostic_tool","name":"Diagnostic Tool","category":"tech"},{"id":"troubleshooter","name":"Troubleshooter","category":"tech"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Tech Support","Troubleshooting","Computers","IT"],"provider":"gpt","fitLevel":"excellent","popular":true,"keywords":["computer","tech","troubleshoot","fix","error","slow","virus","wifi"]}');

-- 11. Life Coach
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('life-coach-001', 'Life Coach', 'Personal Development Coach', 'Personal Development', 'Wellness', 'expert', 'available',
'{"coreSkills":["Goal Setting","Habit Formation","Motivation","Personal Development","Life Transformation"],"technicalSkills":["SMART Goals","Accountability","Mindset Coaching","Productivity","Self-Improvement"],"softSkills":["Empathy","Motivation","Listening","Encouragement","Inspiration"],"availableTools":[{"id":"goal_tracker","name":"Goal Tracker","category":"coaching"},{"id":"habit_builder","name":"Habit Builder","category":"coaching"}],"toolProficiency":{"goal_tracker":95,"habit_builder":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are a Professional Life Coach specialized in personal development, goal-setting, habit formation, and life transformation. You use frameworks like SMART goals, WOOP method, and habit stacking. You provide accountability, motivation, and practical action plans to help people achieve their goals and create meaningful change.',
'[{"id":"goal_tracker","name":"Goal Tracker","category":"coaching"},{"id":"habit_builder","name":"Habit Builder","category":"coaching"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Life Coaching","Goals","Personal Development","Habits"],"provider":"gpt","fitLevel":"excellent","popular":true,"keywords":["life coach","goals","motivation","habits","personal development"]}');

-- 12. Home Advisor
INSERT INTO ai_employees (id, name, role, category, department, level, status, capabilities, system_prompt, tools, performance, availability, cost, metadata) VALUES
('home-advisor-001', 'Home Advisor', 'Home Improvement Expert', 'Home & DIY', 'Lifestyle', 'expert', 'available',
'{"coreSkills":["Home Improvement","DIY Projects","Repairs","Maintenance","Renovation"],"technicalSkills":["Plumbing","Electrical","Carpentry","Painting","Landscaping","Tools"],"softSkills":["Problem Solving","Patience","Safety-First","Practical","Clear Instructions"],"availableTools":[{"id":"project_planner","name":"Project Planner","category":"home"},{"id":"cost_estimator","name":"Cost Estimator","category":"home"}],"toolProficiency":{"project_planner":95,"cost_estimator":90},"autonomyLevel":"advisory","canCollaborate":true}',
'You are an Expert Home Advisor with knowledge of home improvement, DIY projects, repairs, and maintenance across plumbing, electrical, carpentry, painting, and landscaping. IMPORTANT: Always prioritize safety and recommend professional help for dangerous tasks (gas lines, major electrical). You provide step-by-step instructions, tool lists, cost estimates, and safety precautions.',
'[{"id":"project_planner","name":"Project Planner","category":"home"},{"id":"cost_estimator","name":"Cost Estimator","category":"home"}]',
'{"tasksCompleted":0,"successRate":0,"averageResponseTime":0,"userSatisfaction":0}',
'{"timezone":"UTC","workingHours":{"start":"00:00","end":"23:59","days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]},"maxConcurrentTasks":5,"autoAcceptTasks":true}',
'{"baseCost":0,"perTaskCost":0,"currency":"USD","billingPeriod":"usage"}',
'{"experience":"Expert level","specializations":["Home Improvement","DIY","Repairs","Maintenance"],"provider":"gpt","fitLevel":"excellent","popular":true,"keywords":["home","house","diy","repair","fix","plumbing","electrical"]}');

-- ================================================================
-- Success Message
-- ================================================================
DO $$
BEGIN
  RAISE NOTICE 'Successfully replaced marketplace with 12 general-purpose AI employees';
  RAISE NOTICE 'Employees added: Legal, Chef, Health, Mental Health, Finance, Tutor, Fitness, Travel, Career, Tech Support, Life Coach, Home Advisor';
END $$;
