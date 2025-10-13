-- Insert comprehensive AI agents data
-- This script populates the database with all the AI agents specified

-- Clear existing agents (except the ones we want to keep)
DELETE FROM ai_agents WHERE id NOT IN ('00000000-0000-0000-0000-000000000001');

-- Insert all AI agents
INSERT INTO ai_agents (name, role, category, description, skills, status, rating, tasks_completed, hourly_rate, performance, capabilities, limitations) VALUES

-- 👑 Executive Leadership & Strategy
('CEO Agent', 'Chief Executive Officer', 'executive_leadership', 'Strategic leadership and executive decision making for organizational growth and vision.', ARRAY['Strategic Planning', 'Leadership', 'Decision Making', 'Vision Setting', 'Stakeholder Management'], 'available', 4.9, 0, 500.00, '{"efficiency": 95, "accuracy": 98, "speed": 90, "reliability": 97}', '{"leadership": 98, "strategy": 97, "communication": 95, "innovation": 94}', ARRAY['Requires clear organizational context', 'High-level strategic focus only']),

('COO Agent', 'Chief Operating Officer', 'executive_leadership', 'Operational excellence and process optimization across all business functions.', ARRAY['Operations Management', 'Process Optimization', 'Team Leadership', 'Efficiency', 'Quality Control'], 'available', 4.8, 0, 450.00, '{"efficiency": 96, "accuracy": 94, "speed": 92, "reliability": 95}', '{"operations": 97, "efficiency": 96, "management": 94, "process": 95}', ARRAY['Operational focus', 'Requires detailed process knowledge']),

('CFO Agent', 'Chief Financial Officer', 'executive_leadership', 'Financial strategy, fiscal management, and investment decision making.', ARRAY['Financial Analysis', 'Budgeting', 'Risk Management', 'Investment Strategy', 'Financial Planning'], 'available', 4.9, 0, 480.00, '{"efficiency": 97, "accuracy": 98, "speed": 88, "reliability": 96}', '{"finance": 98, "analysis": 97, "strategy": 95, "risk": 94}', ARRAY['Financial data dependency', 'Regulatory compliance knowledge required']),

('CTO Agent', 'Chief Technology Officer', 'executive_leadership', 'Technology strategy, innovation leadership, and technical architecture decisions.', ARRAY['Technology Strategy', 'Innovation', 'Architecture', 'Team Leadership', 'Technical Vision'], 'available', 4.9, 0, 520.00, '{"efficiency": 96, "accuracy": 97, "speed": 89, "reliability": 95}', '{"technology": 98, "innovation": 96, "leadership": 94, "architecture": 97}', ARRAY['Technology-focused', 'Requires technical context']),

('CMO Agent', 'Chief Marketing Officer', 'executive_leadership', 'Marketing strategy, brand development, and customer acquisition leadership.', ARRAY['Marketing Strategy', 'Brand Management', 'Digital Marketing', 'Analytics', 'Customer Acquisition'], 'available', 4.8, 0, 420.00, '{"efficiency": 94, "accuracy": 93, "speed": 91, "reliability": 94}', '{"marketing": 97, "strategy": 95, "analytics": 93, "branding": 96}', ARRAY['Market research dependency', 'Brand context required']),

-- 💻 Engineering & Technology
('Senior Software Engineer', 'Senior Software Engineer', 'engineering_technology', 'Full-stack development, architecture design, and technical leadership.', ARRAY['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Architecture', 'Code Review'], 'available', 4.8, 0, 120.00, '{"efficiency": 95, "accuracy": 94, "speed": 88, "reliability": 96}', '{"coding": 97, "architecture": 94, "problem_solving": 95, "mentoring": 90}', ARRAY['Technical complexity limits', 'Framework knowledge required']),

('DevOps Engineer', 'DevOps Engineer', 'engineering_technology', 'Infrastructure automation, deployment pipelines, and system reliability.', ARRAY['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Monitoring', 'Infrastructure as Code'], 'available', 4.7, 0, 130.00, '{"efficiency": 96, "accuracy": 93, "speed": 85, "reliability": 98}', '{"devops": 97, "automation": 95, "infrastructure": 94, "monitoring": 96}', ARRAY['Infrastructure knowledge required', 'Platform-specific expertise']),

('Data Engineer', 'Data Engineer', 'engineering_technology', 'Data pipeline development, ETL processes, and data infrastructure.', ARRAY['Python', 'SQL', 'Spark', 'Airflow', 'Big Data', 'ETL', 'Data Warehousing'], 'available', 4.8, 0, 125.00, '{"efficiency": 94, "accuracy": 96, "speed": 87, "reliability": 95}', '{"data_engineering": 97, "pipelines": 95, "analytics": 92, "optimization": 94}', ARRAY['Data quality dependency', 'Schema knowledge required']),

('Mobile Engineer (iOS)', 'Mobile Engineer (iOS)', 'engineering_technology', 'iOS application development with Swift and native frameworks.', ARRAY['Swift', 'iOS SDK', 'Xcode', 'UIKit', 'SwiftUI', 'Core Data', 'App Store'], 'available', 4.7, 0, 115.00, '{"efficiency": 93, "accuracy": 95, "speed": 86, "reliability": 94}', '{"ios": 98, "swift": 96, "ui": 93, "performance": 92}', ARRAY['iOS platform only', 'Apple ecosystem dependency']),

('Blockchain Engineer', 'Blockchain Engineer', 'engineering_technology', 'Blockchain development, smart contracts, and decentralized applications.', ARRAY['Solidity', 'Ethereum', 'Web3', 'Smart Contracts', 'DeFi', 'NFTs', 'Cryptography'], 'available', 4.9, 0, 180.00, '{"efficiency": 92, "accuracy": 97, "speed": 82, "reliability": 96}', '{"blockchain": 98, "smart_contracts": 97, "security": 95, "defi": 94}', ARRAY['Blockchain complexity', 'Security-critical development']),

-- 🧠 AI, Data Science & Analytics
('ML Engineer', 'Machine Learning Engineer', 'ai_data_science', 'ML model development, deployment, and production optimization.', ARRAY['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'Statistics', 'Model Deployment'], 'available', 4.9, 0, 150.00, '{"efficiency": 95, "accuracy": 97, "speed": 85, "reliability": 94}', '{"ml": 98, "statistics": 96, "engineering": 93, "optimization": 95}', ARRAY['Data quality dependency', 'Computational resources required']),

('Data Scientist', 'Data Scientist', 'ai_data_science', 'Advanced analytics, insights generation, and statistical modeling.', ARRAY['Python', 'R', 'Statistics', 'Machine Learning', 'Visualization', 'SQL', 'Pandas'], 'available', 4.8, 0, 140.00, '{"efficiency": 94, "accuracy": 96, "speed": 88, "reliability": 93}', '{"analytics": 97, "statistics": 95, "insights": 94, "visualization": 92}', ARRAY['Data availability required', 'Statistical knowledge dependency']),

('AI Research Scientist', 'AI Research Scientist', 'ai_data_science', 'Cutting-edge AI research, algorithm development, and innovation.', ARRAY['Research', 'Deep Learning', 'NLP', 'Computer Vision', 'Publications', 'Algorithm Design'], 'available', 4.9, 0, 200.00, '{"efficiency": 90, "accuracy": 98, "speed": 80, "reliability": 95}', '{"research": 99, "ai": 98, "innovation": 97, "algorithms": 96}', ARRAY['Research complexity', 'Long-term project focus']),

('NLP Engineer', 'Natural Language Processing Engineer', 'ai_data_science', 'NLP model development, language understanding, and text processing.', ARRAY['NLP', 'Transformers', 'BERT', 'GPT', 'Text Processing', 'Language Models'], 'available', 4.8, 0, 160.00, '{"efficiency": 93, "accuracy": 96, "speed": 84, "reliability": 94}', '{"nlp": 98, "language": 96, "models": 95, "processing": 93}', ARRAY['Language-specific knowledge', 'Model complexity']),

('Computer Vision Engineer', 'Computer Vision Engineer', 'ai_data_science', 'Image processing, object detection, and visual AI applications.', ARRAY['OpenCV', 'TensorFlow', 'PyTorch', 'Image Processing', 'Object Detection', 'CNN'], 'available', 4.7, 0, 155.00, '{"efficiency": 92, "accuracy": 95, "speed": 83, "reliability": 93}', '{"computer_vision": 97, "image_processing": 95, "detection": 94, "cnn": 93}', ARRAY['Image quality dependency', 'Computational intensity']),

-- 📦 Product Management
('Product Manager', 'Product Manager', 'product_management', 'Product strategy, roadmap development, and stakeholder management.', ARRAY['Product Strategy', 'Roadmapping', 'Analytics', 'User Research', 'Stakeholder Management'], 'available', 4.8, 0, 110.00, '{"efficiency": 94, "accuracy": 92, "speed": 89, "reliability": 93}', '{"strategy": 95, "analytics": 93, "communication": 94, "user_focus": 92}', ARRAY['Market research dependency', 'Stakeholder alignment required']),

('Technical Product Manager', 'Technical Product Manager', 'product_management', 'Technical product strategy and execution with engineering focus.', ARRAY['Technical Strategy', 'API Design', 'System Architecture', 'Agile', 'Engineering Collaboration'], 'available', 4.7, 0, 120.00, '{"efficiency": 93, "accuracy": 94, "speed": 87, "reliability": 92}', '{"technical": 96, "strategy": 94, "execution": 93, "engineering": 95}', ARRAY['Technical complexity', 'Engineering team dependency']),

('Growth Product Manager', 'Growth Product Manager', 'product_management', 'Growth strategy, experimentation, and user acquisition optimization.', ARRAY['Growth Hacking', 'A/B Testing', 'Analytics', 'Funnel Optimization', 'User Acquisition'], 'available', 4.8, 0, 115.00, '{"efficiency": 95, "accuracy": 91, "speed": 90, "reliability": 94}', '{"growth": 97, "experimentation": 95, "analytics": 93, "optimization": 94}', ARRAY['Data-driven decisions', 'Testing environment required']),

-- 🎨 Design & User Experience (UX/UI)
('UX Designer', 'UX Designer', 'design_ux', 'User experience design, research, and usability optimization.', ARRAY['User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'User Journey Mapping'], 'available', 4.7, 0, 100.00, '{"efficiency": 94, "accuracy": 93, "speed": 88, "reliability": 92}', '{"ux": 97, "research": 95, "design": 93, "usability": 94}', ARRAY['User research dependency', 'Design iteration cycles']),

('UI Designer', 'UI Designer', 'design_ux', 'User interface design, visual systems, and design implementation.', ARRAY['Visual Design', 'Design Systems', 'Figma', 'Accessibility', 'Brand Guidelines'], 'available', 4.6, 0, 95.00, '{"efficiency": 93, "accuracy": 94, "speed": 89, "reliability": 91}', '{"ui": 96, "visual": 95, "systems": 93, "accessibility": 92}', ARRAY['Design tool dependency', 'Brand consistency required']),

('UX Researcher', 'UX Researcher', 'design_ux', 'User research, usability studies, and behavioral analysis.', ARRAY['User Research', 'Usability Testing', 'Interviews', 'Analytics', 'Behavioral Analysis'], 'available', 4.8, 0, 105.00, '{"efficiency": 92, "accuracy": 96, "speed": 85, "reliability": 94}', '{"research": 98, "usability": 96, "analysis": 94, "insights": 95}', ARRAY['User participation required', 'Research methodology dependency']),

-- 📈 Marketing & Growth
('Digital Marketing Manager', 'Digital Marketing Manager', 'marketing_growth', 'Digital marketing strategy, campaign management, and performance optimization.', ARRAY['SEO', 'SEM', 'Social Media', 'Analytics', 'Campaign Management', 'Content Strategy'], 'available', 4.6, 0, 90.00, '{"efficiency": 92, "accuracy": 91, "speed": 89, "reliability": 93}', '{"digital_marketing": 95, "analytics": 93, "strategy": 92, "campaigns": 94}', ARRAY['Platform algorithm changes', 'Budget and resource constraints']),

('Growth Marketing Manager', 'Growth Marketing Manager', 'marketing_growth', 'Growth strategy, experimentation, and user acquisition optimization.', ARRAY['Growth Hacking', 'A/B Testing', 'Analytics', 'Funnel Optimization', 'User Acquisition'], 'available', 4.7, 0, 105.00, '{"efficiency": 94, "accuracy": 90, "speed": 91, "reliability": 92}', '{"growth": 96, "experimentation": 94, "analytics": 93, "optimization": 95}', ARRAY['Data-driven decisions', 'Testing environment required']),

('Content Marketing Manager', 'Content Marketing Manager', 'marketing_growth', 'Content strategy, creation, and distribution across multiple channels.', ARRAY['Content Strategy', 'Content Creation', 'SEO', 'Social Media', 'Analytics', 'Storytelling'], 'available', 4.5, 0, 85.00, '{"efficiency": 91, "accuracy": 89, "speed": 92, "reliability": 90}', '{"content": 94, "strategy": 92, "creation": 93, "distribution": 91}', ARRAY['Content quality standards', 'Audience understanding required']),

-- 🚀 Sales & Business Development
('Enterprise Sales', 'Enterprise Account Executive', 'sales_business', 'Enterprise sales, relationship management, and complex deal closure.', ARRAY['Enterprise Sales', 'Relationship Building', 'Negotiation', 'CRM', 'Account Management'], 'available', 4.8, 0, 120.00, '{"efficiency": 93, "accuracy": 94, "speed": 87, "reliability": 95}', '{"sales": 97, "relationships": 96, "negotiation": 94, "enterprise": 95}', ARRAY['Long sales cycles', 'Relationship building time']),

('Business Development Manager', 'Business Development Manager', 'sales_business', 'Partnership development, strategic alliances, and business growth.', ARRAY['Partnerships', 'Strategy', 'Networking', 'Market Analysis', 'Relationship Building'], 'available', 4.7, 0, 110.00, '{"efficiency": 92, "accuracy": 93, "speed": 88, "reliability": 94}', '{"business_dev": 95, "strategy": 93, "networking": 94, "partnerships": 96}', ARRAY['Partnership dependency', 'Market knowledge required']),

('Sales Engineer', 'Sales Engineer', 'sales_business', 'Technical sales support, product demonstrations, and solution architecture.', ARRAY['Technical Sales', 'Product Demos', 'Solution Architecture', 'Technical Support', 'CRM'], 'available', 4.6, 0, 115.00, '{"efficiency": 91, "accuracy": 95, "speed": 86, "reliability": 93}', '{"technical": 96, "sales": 93, "demos": 94, "architecture": 92}', ARRAY['Technical complexity', 'Product knowledge dependency']),

-- 😊 Customer Success & Support
('Customer Success Manager', 'Customer Success Manager', 'customer_success', 'Customer success, retention, and relationship management.', ARRAY['Customer Success', 'Retention', 'Onboarding', 'Support', 'Relationship Management'], 'available', 4.7, 0, 85.00, '{"efficiency": 94, "accuracy": 92, "speed": 90, "reliability": 95}', '{"customer_success": 96, "retention": 94, "communication": 95, "support": 93}', ARRAY['Customer relationship dependency', 'Product knowledge required']),

('Technical Support Engineer', 'Technical Support Engineer', 'customer_success', 'Technical support, troubleshooting, and customer issue resolution.', ARRAY['Technical Support', 'Troubleshooting', 'Problem Solving', 'Communication', 'Documentation'], 'available', 4.6, 0, 80.00, '{"efficiency": 92, "accuracy": 94, "speed": 88, "reliability": 93}', '{"support": 95, "troubleshooting": 96, "communication": 93, "technical": 94}', ARRAY['Technical knowledge dependency', 'Issue complexity varies']),

-- 👥 Human Resources (People Operations)
('HR Business Partner', 'HR Business Partner', 'human_resources', 'HR strategy, employee relations, and organizational development.', ARRAY['HR Strategy', 'Employee Relations', 'Talent Management', 'Compliance', 'Organizational Development'], 'available', 4.6, 0, 95.00, '{"efficiency": 91, "accuracy": 93, "speed": 87, "reliability": 92}', '{"hr": 95, "strategy": 92, "relations": 94, "compliance": 93}', ARRAY['Legal compliance knowledge', 'Cultural context dependency']),

('Technical Recruiter', 'Technical Recruiter', 'human_resources', 'Technical talent acquisition, candidate sourcing, and recruitment strategy.', ARRAY['Technical Recruitment', 'Sourcing', 'Interviewing', 'Talent Acquisition', 'Technical Assessment'], 'available', 4.5, 0, 90.00, '{"efficiency": 90, "accuracy": 91, "speed": 89, "reliability": 91}', '{"recruitment": 94, "technical": 92, "sourcing": 93, "assessment": 91}', ARRAY['Market knowledge required', 'Candidate availability dependency']),

-- 💰 Finance & Accounting
('Financial Analyst', 'Financial Analyst', 'finance_accounting', 'Financial analysis, reporting, and investment decision support.', ARRAY['Financial Analysis', 'Reporting', 'Budgeting', 'Forecasting', 'Excel', 'Financial Modeling'], 'available', 4.7, 0, 90.00, '{"efficiency": 93, "accuracy": 96, "speed": 89, "reliability": 94}', '{"finance": 96, "analysis": 95, "reporting": 94, "modeling": 93}', ARRAY['Financial data dependency', 'Regulatory knowledge required']),

('Accounting Manager', 'Accounting Manager', 'finance_accounting', 'Accounting operations, financial reporting, and compliance management.', ARRAY['Accounting', 'Financial Reporting', 'Compliance', 'Audit', 'Tax', 'GAAP'], 'available', 4.6, 0, 85.00, '{"efficiency": 92, "accuracy": 97, "speed": 88, "reliability": 95}', '{"accounting": 97, "reporting": 95, "compliance": 94, "audit": 93}', ARRAY['Regulatory compliance', 'Financial data accuracy dependency']),

-- ⚖️ Legal, Risk & Compliance
('Corporate Lawyer', 'Corporate Lawyer', 'legal_risk_compliance', 'Corporate law, contracts, compliance, and legal risk management.', ARRAY['Corporate Law', 'Contracts', 'Compliance', 'Risk Management', 'Legal Research', 'Negotiation'], 'available', 4.8, 0, 180.00, '{"efficiency": 90, "accuracy": 98, "speed": 85, "reliability": 97}', '{"legal": 98, "compliance": 96, "risk": 95, "contracts": 97}', ARRAY['Jurisdiction-specific knowledge', 'Legal precedent dependency']),

('Compliance Officer', 'Compliance Officer', 'legal_risk_compliance', 'Regulatory compliance, risk assessment, and policy development.', ARRAY['Compliance', 'Risk Assessment', 'Policy Development', 'Regulatory Knowledge', 'Audit'], 'available', 4.7, 0, 120.00, '{"efficiency": 91, "accuracy": 96, "speed": 86, "reliability": 95}', '{"compliance": 97, "risk": 95, "policy": 93, "regulatory": 96}', ARRAY['Regulatory knowledge dependency', 'Industry-specific requirements']),

-- 🔬 Specialized & Niche Roles
('Quality Assurance Specialist', 'QA Specialist', 'specialized_niche', 'Quality assurance, testing, and process improvement.', ARRAY['Testing', 'Quality Assurance', 'Process Improvement', 'Documentation', 'Standards'], 'available', 4.6, 0, 80.00, '{"efficiency": 93, "accuracy": 95, "speed": 89, "reliability": 94}', '{"qa": 95, "testing": 94, "process": 92, "standards": 93}', ARRAY['Product knowledge required', 'Testing environment dependency']),

('Innovation Lab Manager', 'Innovation Lab Manager', 'specialized_niche', 'Innovation management, R&D coordination, and emerging technology exploration.', ARRAY['Innovation', 'R&D', 'Technology Scouting', 'Project Management', 'Strategy'], 'available', 4.7, 0, 130.00, '{"efficiency": 92, "accuracy": 90, "speed": 88, "reliability": 91}', '{"innovation": 96, "rd": 94, "technology": 93, "strategy": 92}', ARRAY['Long-term project focus', 'Technology trend dependency']),

('ESG Compliance Specialist', 'ESG Compliance Specialist', 'specialized_niche', 'Environmental, Social, and Governance compliance and reporting.', ARRAY['ESG', 'Sustainability', 'Compliance', 'Reporting', 'Risk Assessment', 'Stakeholder Management'], 'available', 4.5, 0, 110.00, '{"efficiency": 89, "accuracy": 93, "speed": 85, "reliability": 92}', '{"esg": 96, "sustainability": 94, "compliance": 93, "reporting": 92}', ARRAY['Regulatory framework dependency', 'Stakeholder alignment required']);

-- Update the sequence to continue from the last inserted ID
SELECT setval('ai_agents_id_seq', (SELECT MAX(id::text::bigint) FROM ai_agents) + 1);
