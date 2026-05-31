import { motion } from 'motion/react';
import axios from "axios";
import { useState, useEffect, useRef } from 'react';
import { 
  Leaf, 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  ExternalLink, 
  Play, 
  FileText, 
  Award, 
  CheckCircle, 
  X, 
  Lightbulb,
  BookOpen,
  Globe,
  Youtube,
  Brain,
  Target,
  MessageCircle,
  Sparkles,
  TreePine,
  Droplets,
  Sun,
  Wind,
  Flower,
  ChevronRight,
  Recycle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface EcoAIProps {
  onBack: () => void;
  userName: string;
  lessonData: {
    id: number;
    title: string;
    category: string;
    description: string;
    topics: string[];
    learningLink?: string;
  };
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  resources?: Resource[];
  quiz?: Quiz;
}

interface Resource {
  type: 'youtube' | 'article' | 'website';
  title: string;
  url: string;
  description: string;
}

interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizSession {
  questions: Quiz[];
  currentQuestionIndex: number;
  answers: (number | null)[];
  score: number;
  isCompleted: boolean;
  startTime: Date;
  endTime?: Date;
}

const EcoAI = ({ onBack, userName, lessonData }: EcoAIProps) => {
  const [showFloatingElements, setShowFloatingElements] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [conversationStage, setConversationStage] = useState<'intro' | 'learning' | 'quiz' | 'completed'>('intro');
  const [learningProgress, setLearningProgress] = useState(0);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get learning links for each category
  const getLearningLinks = (): Resource[] => {
    const resources: Resource[] = [];
    
    // Water-related lessons
    if (lessonData.title.toLowerCase().includes('water') || lessonData.category === 'water') {
      resources.push({
        type: 'website',
        title: 'Water Management & Conservation Basics',
        url: 'https://byjus.com/chemistry/water-management/',
        description: 'Comprehensive guide to water conservation principles and techniques'
      });
    }
    
    // SOLAR ENERGY SPECIFIC LINKS - Only for solar lessons
    if (lessonData.title.toLowerCase().includes('solar')) {
      resources.push({
        type: 'website',
        title: 'Understanding Solar Energy Fundamentals',
        url: 'https://www.udemy.com/course/understanding-solar/?utm_source=adwords&utm_medium=udemyads&utm_campaign=Search_Keyword_Beta_Prof_la.DE_cc.ROW-German&campaigntype=Search&portfolio=ROW-German&language=DE&product=Course&test=&audience=Keyword&topic=SolarEnergy&priority=Beta&utm_content=deal4584&utm_term=_._ag_168594845001_._ad_706257671995_._kw_solarenergie+ausbildung_._de_c_._dm__._pl__._ti_kwd-1928346736483_._li_1007820_._pd__._&matchtype=b&gad_source=1&gad_campaignid=21485730605&gbraid=0AAAAADROdO2Tw3ooou-Hxjgn170GrzPRR&gclid=Cj0KCQjw8p7GBhCjARIsAEhghZ2MflEdpis9t-qbCrPxmCAVz1RCofCSF4kVoXMKd9l4XbDITyOH2AwaAsxeEALw_wcB&couponCode=PMNVD2025',
        description: 'Professional course on solar energy systems and fundamentals'
      });
      resources.push({
        type: 'website',
        title: 'Solar Power World - Solar Energy Guide',
        url: 'https://www.solarpowerworldonline.com/solar-power-101/',
        description: 'Complete guide to solar power technology and installation'
      });
      resources.push({
        type: 'website',
        title: 'National Renewable Energy Laboratory - Solar Basics',
        url: 'https://www.nrel.gov/research/re-solar.html',
        description: 'Official research and information on solar energy from NREL'
      });
    }
    
    // WIND ENERGY SPECIFIC LINKS - Only for wind lessons  
    if (lessonData.title.toLowerCase().includes('wind')) {
      resources.push({
        type: 'website',
        title: 'Wind Energy Systems Technology Guide',
        url: 'https://www.herofutureenergies.com/blog/wind-energy-systems/',
        description: 'Comprehensive guide to wind energy technology and turbine systems'
      });
      resources.push({
        type: 'website',
        title: 'American Wind Energy Association',
        url: 'https://www.awea.org/wind-101/basics-of-wind-energy',
        description: 'Industry association guide to wind energy fundamentals'
      });
      resources.push({
        type: 'website',
        title: 'Wind Power Engineering & Development',
        url: 'https://www.windpowerengineering.com/wind-power-101/',
        description: 'Technical overview of wind power engineering and development'
      });
    }
    
    // GENERAL RENEWABLE ENERGY LINKS - For broader renewable energy topics
    if (lessonData.category.toLowerCase() === 'renewable energy' && 
        !lessonData.title.toLowerCase().includes('solar') && 
        !lessonData.title.toLowerCase().includes('wind')) {
      resources.push({
        type: 'website',
        title: 'Renewable Energy Overview - IEA',
        url: 'https://www.iea.org/topics/renewables',
        description: 'International Energy Agency comprehensive renewable energy overview'
      });
      resources.push({
        type: 'website',
        title: 'Renewable Energy 101 - NREL',
        url: 'https://www.nrel.gov/research/re-intro.html',
        description: 'Introduction to all renewable energy technologies'
      });
    }
    
    // Composting lessons
    if (lessonData.title.toLowerCase().includes('composting')) {
      resources.push({
        type: 'website',
        title: 'Composting Made Simple',
        url: 'https://share.google/9qJHwZNp8kvkUptbc',
        description: 'Step-by-step guide to home composting'
      });
    }
    
    // Biodiversity lessons
    if (lessonData.title.toLowerCase().includes('biodiversity')) {
      resources.push({
        type: 'website',
        title: 'Conservation of Biodiversity',
        url: 'https://www.vedantu.com/biology/conservation-of-biodiversity',
        description: 'Understanding biodiversity conservation principles'
      });
    }
    
    // Waste reduction lessons
    if (lessonData.title.toLowerCase().includes('zero waste') || (lessonData.title.toLowerCase().includes('waste') && lessonData.category === 'waste')) {
      resources.push({
        type: 'website',
        title: 'Zero Waste Lifestyle Guide',
        url: 'https://onetreeplanted.org/blogs/stories/how-to-reduce-waste?srsltid=AfmBOoq-0ebRDScT3ePG7QUX7RWFAyNjJ11fwINmPRhpxTv7YhYW_PfD',
        description: 'Complete guide to reducing waste and living sustainably'
      });
    }

    // Add lesson-specific link if provided and not already included
    if (lessonData.learningLink && !resources.some(r => r.url === lessonData.learningLink)) {
      resources.push({
        type: 'website',
        title: `Study Materials for ${lessonData.title}`,
        url: lessonData.learningLink,
        description: 'Official study materials and additional resources'
      });
    }

    return resources;
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowFloatingElements(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Initial AI greeting with study resources
    const learningResources = getLearningLinks();
    const initialMessage: Message = {
      id: '1',
      type: 'ai',
      content: `Hello ${userName}! 🌱 I'm EcoBot, your personal environmental learning assistant. I'm here to help you master "${lessonData.title}". 

I can:
✨ Answer your questions about ${lessonData.category.toLowerCase()}
🔗 Provide relevant resources and videos
📝 Create personalized quizzes to test your knowledge
💡 Give you practical tips and real-world examples

📚 **Study Resources Available:**
I have curated learning materials specifically for this topic. Check out the resources below!

Ready to start learning? Ask me anything about ${lessonData.title.toLowerCase()} or type "begin lesson" to start our structured learning journey!`,
      timestamp: new Date(),
      resources: learningResources.length > 0 ? learningResources : undefined
    };
    setMessages([initialMessage]);
  }, [userName, lessonData]);

  // Comprehensive topic content for structured learning
  const getTopicContent = (topicIndex: number) => {
    const topicContents = {
      'Water Conservation': [
        {
          title: "Understanding Water Scarcity",
          content: `🌊 **Water Scarcity Crisis**
          
Water is our planet's most precious resource, yet it's becoming increasingly scarce. Let's understand the basics:

**Key Facts:**
• Only 2.5% of Earth's water is freshwater
• Less than 1% is accessible for human use
• 2 billion people lack access to safely managed drinking water
• By 2025, half the world's population will live in water-stressed areas

**Main Causes:**
1. **Climate Change** - Altered precipitation patterns
2. **Population Growth** - Increasing demand
3. **Pollution** - Contamination of water sources
4. **Over-extraction** - Unsustainable use of groundwater

**Why This Matters:**
Water conservation isn't just about saving money on bills - it's about ensuring future generations have access to clean, safe water. Every drop counts!`
        },
        {
          title: "Household Water Conservation",
          content: `🏠 **Smart Water Use at Home**

Your home is where you can make the biggest impact! Here are proven strategies:

**Bathroom Conservation (70% of home water use):**
• Take shorter showers (save 5-10 gallons per minute)
• Fix leaky faucets immediately (one drip per second = 5 gallons/day)
• Install low-flow showerheads and toilets
• Turn off tap while brushing teeth

**Kitchen & Laundry:**
• Run dishwashers and washing machines only with full loads
• Use cold water for washing clothes when possible
• Install aerators on faucets
• Collect pasta/vegetable water for plants after cooling

**Outdoor Conservation:**
• Water gardens during cooler parts of the day
• Use drip irrigation systems
• Choose drought-resistant native plants
• Collect rainwater in barrels

**Smart Technology:**
• Install smart water meters
• Use water-efficient appliances (look for WaterSense labels)
• Consider greywater systems for irrigation`
        },
        {
          title: "Global Water Solutions",
          content: `🌍 **Large-Scale Water Solutions**

Beyond individual actions, understanding global solutions helps you support the right initiatives:

**Technological Innovations:**
• **Desalination** - Converting seawater to freshwater
• **Water Recycling** - Treating wastewater for reuse
• **Smart Irrigation** - Precision agriculture systems
• **Atmospheric Water Generation** - Extracting water from air

**Policy Solutions:**
• Water pricing that reflects true value
• Regulations on industrial water use
• Investment in water infrastructure
• International cooperation on shared water resources

**Community Initiatives:**
• Watershed protection programs
• Community water gardens
• Rainwater harvesting systems
• Educational campaigns

**How You Can Support:**
• Vote for politicians who prioritize water conservation
• Support organizations working on water access
• Choose products from water-conscious companies
• Participate in local watershed cleanups`
        }
      ],
      'Renewable Energy': [
        {
          title: "Understanding Renewable Energy",
          content: `⚡ **The Power of Renewable Energy**

Renewable energy is our pathway to a sustainable future. Let's explore the fundamentals:

**What is Renewable Energy?**
Energy derived from natural sources that are constantly replenished and never run out.

**Main Types:**
1. **Solar Energy** ☀️
   - Photovoltaic (PV) panels convert sunlight to electricity
   - Solar thermal for heating water/spaces
   - Fastest-growing energy source globally

2. **Wind Energy** 💨
   - Wind turbines convert wind motion to electricity
   - Onshore and offshore installations
   - Can power entire cities

3. **Hydroelectric** 🌊
   - Uses flowing water to generate electricity
   - Most established renewable technology
   - Provides 16% of world's electricity

4. **Geothermal** 🌋
   - Harnesses Earth's internal heat
   - Reliable baseload power
   - Also used for heating/cooling

5. **Biomass** 🌱
   - Organic materials for energy
   - Can be carbon-neutral when managed sustainably`
        },
        {
          title: "Benefits and Challenges",
          content: `📊 **Renewable Energy: The Complete Picture**

**Environmental Benefits:**
• **Zero Emissions** - No greenhouse gases during operation
• **Air Quality** - Reduced pollution improves health
• **Water Conservation** - Less water needed vs. fossil fuels
• **Land Use** - Can coexist with agriculture (agrivoltaics)

**Economic Advantages:**
• **Job Creation** - Renewable sector employs millions
• **Energy Independence** - Reduces reliance on imports
• **Stable Costs** - No fuel costs, predictable pricing
• **Rural Development** - New income for landowners

**Current Challenges:**
• **Intermittency** - Sun doesn't always shine, wind doesn't always blow
• **Storage** - Need better battery technology
• **Grid Integration** - Requires infrastructure updates
• **Initial Costs** - High upfront investment

**Solutions in Development:**
• Advanced battery storage systems
• Smart grid technology
• Improved energy efficiency
• Hybrid renewable systems
• Green hydrogen production`
        },
        {
          title: "Personal Renewable Energy Actions",
          content: `🏡 **Bringing Renewables Home**

**Direct Actions:**
• **Solar Installation** - Rooftop solar panels or community solar
• **Green Energy Plans** - Choose renewable electricity from your utility
• **Energy Efficiency** - Reduce overall energy demand first
• **Electric Vehicles** - Powered by clean electricity

**Supporting the Transition:**
• **Advocacy** - Support renewable energy policies
• **Investment** - Choose clean energy funds/stocks
• **Education** - Learn and share renewable energy benefits
• **Community Projects** - Support local renewable initiatives

**Financial Incentives:**
• Federal and state tax credits
• Net metering programs
• Renewable energy certificates (RECs)
• Green financing options

**Calculating Impact:**
A typical home solar system (6kW) can:
• Save $1,000+ annually on electricity
• Prevent 100,000+ lbs of CO2 over 20 years
• Increase home value by $15,000+
• Pay for itself in 6-10 years

**Getting Started:**
1. Energy audit to understand current usage
2. Research local incentives and installers
3. Get multiple quotes for solar systems
4. Consider community solar if rooftop isn't suitable
5. Switch to a green energy plan immediately`
        }
      ],
      'Waste Reduction': [
        {
          title: "The Waste Crisis",
          content: `🗑️ **Understanding Our Waste Problem**

We're drowning in waste, but understanding the problem is the first step to solutions:

**Staggering Statistics:**
• 2 billion tons of waste generated globally each year
• Average American produces 4.5 lbs of waste daily
• Only 32% of waste is recycled or composted
• Great Pacific Garbage Patch is twice the size of Texas

**Types of Waste:**
1. **Organic Waste** (30%) - Food scraps, yard waste
2. **Paper & Cardboard** (25%) - Often recyclable
3. **Plastics** (13%) - Major environmental concern
4. **Metals** (9%) - Highly recyclable
5. **Glass** (5%) - Infinitely recyclable
6. **Electronics** (Growing) - Toxic when improperly disposed

**Environmental Impact:**
• **Greenhouse Gases** - Landfills produce methane
• **Pollution** - Toxins leach into soil and water
• **Wildlife Harm** - Animals mistake plastic for food
• **Resource Depletion** - Linear "take-make-waste" model

**Economic Cost:**
• $200+ billion annually in waste management
• Lost resources worth $1 trillion globally
• Job creation potential in recycling/reuse industries`
        },
        {
          title: "The 5 R's Strategy",
          content: `♻️ **Master the 5 R's of Waste Reduction**

**1. REFUSE** 🚫
*Don't take what you don't need*
• Decline single-use items (straws, bags, utensils)
• Say no to freebies and promotional items
• Refuse excessive packaging
• Skip printed receipts when possible

**2. REDUCE** ⬇️
*Minimize what you consume*
• Buy only what you need
• Choose quality over quantity
• Opt for digital instead of physical
• Minimize packaging by buying in bulk
• Choose reusable over disposable

**3. REUSE** 🔄
*Find new purposes for items*
• Repurpose glass jars for storage
• Turn old t-shirts into cleaning rags
• Use both sides of paper
• Transform containers into planters
• Donate items instead of throwing away

**4. RECYCLE** ♻️
*Process materials into new products*
• Learn your local recycling rules
• Clean containers before recycling
• Separate materials correctly
• Recycle electronics at special centers
• Compost organic waste

**5. ROT** 🌱
*Compost organic materials*
• Food scraps become nutrient-rich soil
• Yard waste returns to the earth
• Reduces methane from landfills
• Creates free fertilizer for gardens`
        },
        {
          title: "Zero Waste Lifestyle",
          content: `🌟 **Moving Toward Zero Waste**

**What is Zero Waste?**
A lifestyle that aims to eliminate waste sent to landfills, incinerators, and the ocean through conscious consumption and circular thinking.

**Zero Waste Swaps:**
• **Plastic bags** → Reusable cloth bags
• **Disposable water bottles** → Stainless steel bottles
• **Paper towels** → Washable cloths
• **Plastic wrap** → Beeswax wraps or glass containers
• **Disposable coffee cups** → Reusable travel mugs
• **Fast fashion** → Quality, timeless pieces

**Zero Waste Kitchen:**
• Meal planning to reduce food waste
• Bulk buying with reusable containers
• Composting all organic waste
• Using every part of vegetables (stems, leaves)
• Storing food properly to extend life

**Bathroom Zero Waste:**
• Shampoo bars instead of plastic bottles
• Bamboo toothbrushes
• Reusable cotton pads
• Menstrual cups or reusable pads
• DIY natural cleaning products

**Beyond Personal Actions:**
• **Circular Economy** - Design out waste from the start
• **Extended Producer Responsibility** - Manufacturers responsible for product lifecycle
• **Community Initiatives** - Tool libraries, repair cafes, swap meets
• **Policy Advocacy** - Support legislation reducing single-use plastics

**Starting Your Journey:**
Begin with small changes and gradually adopt more zero waste practices. Remember: Progress, not perfection!`
        }
      ]
    };

    const categoryContent = topicContents[lessonData.category as keyof typeof topicContents];
    return categoryContent ? categoryContent[topicIndex] : null;
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added with a slight delay
    const scrollToBottom = () => {
      if (scrollContainerRef.current) {
        const scrollElement = scrollContainerRef.current;
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    };
    
    // Use setTimeout to ensure content is rendered before scrolling
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Generate comprehensive 10+ question quiz
  const generateComprehensiveQuiz = (): Quiz[] => {
    const quizzes = {
      'Water Conservation': [
        {
          id: '1',
          question: 'What percentage of Earth\'s water is accessible freshwater for human use?',
          options: ['About 10%', 'Less than 1%', 'Around 5%', 'Approximately 2.5%'],
          correctAnswer: 1,
          explanation: 'Less than 1% of Earth\'s water is accessible freshwater for human use, making conservation critical.'
        },
        {
          id: '2',
          question: 'How much water does a leaky faucet that drips once per second waste per day?',
          options: ['1 gallon', '3 gallons', '5 gallons', '10 gallons'],
          correctAnswer: 2,
          explanation: 'A faucet dripping once per second wastes about 5 gallons per day, or 1,825 gallons per year!'
        },
        {
          id: '3',
          question: 'What percentage of home water use typically occurs in the bathroom?',
          options: ['50%', '60%', '70%', '80%'],
          correctAnswer: 2,
          explanation: 'About 70% of home water use occurs in the bathroom, making it the best place to focus conservation efforts.'
        },
        {
          id: '4',
          question: 'Which is the most effective way to save water while showering?',
          options: ['Use hot water only', 'Take shorter showers', 'Leave water running between rinses', 'Use more soap'],
          correctAnswer: 1,
          explanation: 'Taking shorter showers can save 5-10 gallons per minute reduced, making it highly effective.'
        },
        {
          id: '5',
          question: 'What does WaterSense label indicate?',
          options: ['Higher water pressure', 'Water-efficient products', 'Expensive appliances', 'Luxury features'],
          correctAnswer: 1,
          explanation: 'WaterSense labels indicate EPA-certified water-efficient products that can reduce water use by 20% or more.'
        }
      ],
      'Renewable Energy': [
        {
          id: '1',
          question: 'Which renewable energy source is growing the fastest globally?',
          options: ['Wind', 'Solar', 'Hydroelectric', 'Geothermal'],
          correctAnswer: 1,
          explanation: 'Solar energy is the fastest-growing renewable energy source, with costs dropping dramatically over the past decade.'
        },
        {
          id: '2',
          question: 'What percentage of the world\'s electricity currently comes from hydroelectric power?',
          options: ['8%', '12%', '16%', '20%'],
          correctAnswer: 2,
          explanation: 'Hydroelectric power provides about 16% of the world\'s electricity, making it the most established renewable source.'
        },
        {
          id: '3',
          question: 'What is the main challenge with solar and wind energy?',
          options: ['Too expensive', 'Intermittency', 'Takes too much space', 'Creates pollution'],
          correctAnswer: 1,
          explanation: 'Intermittency is the main challenge - the sun doesn\'t always shine and wind doesn\'t always blow when we need energy.'
        },
        {
          id: '4',
          question: 'What is agrivoltaics?',
          options: ['Solar panels on farms', 'Wind turbines in fields', 'Hydroelectric dams', 'Geothermal farming'],
          correctAnswer: 0,
          explanation: 'Agrivoltaics combines solar panels with agriculture, allowing land to be used for both energy production and farming.'
        },
        {
          id: '5',
          question: 'How much CO2 can a typical 6kW home solar system prevent over 20 years?',
          options: ['50,000 lbs', '75,000 lbs', '100,000+ lbs', '25,000 lbs'],
          correctAnswer: 2,
          explanation: 'A typical 6kW home solar system can prevent over 100,000 pounds of CO2 emissions over 20 years.'
        }
      ],
      'Waste Reduction': [
        {
          id: '1',
          question: 'How much waste does the average American produce daily?',
          options: ['2.5 lbs', '3.5 lbs', '4.5 lbs', '5.5 lbs'],
          correctAnswer: 2,
          explanation: 'The average American produces about 4.5 pounds of waste per day, much higher than the global average.'
        },
        {
          id: '2',
          question: 'What percentage of waste is currently recycled or composted globally?',
          options: ['20%', '32%', '45%', '60%'],
          correctAnswer: 1,
          explanation: 'Only about 32% of waste is currently recycled or composted globally, leaving huge room for improvement.'
        },
        {
          id: '3',
          question: 'What is the largest component of household waste?',
          options: ['Plastics', 'Paper', 'Organic waste', 'Metals'],
          correctAnswer: 2,
          explanation: 'Organic waste (food scraps, yard waste) makes up about 30% of household waste and is easily compostable.'
        },
        {
          id: '4',
          question: 'What does the "R" in the first of the 5 R\'s stand for?',
          options: ['Recycle', 'Reduce', 'Refuse', 'Reuse'],
          correctAnswer: 2,
          explanation: 'REFUSE is the first R - don\'t take what you don\'t need. It\'s the most effective waste reduction strategy.'
        },
        {
          id: '5',
          question: 'How big is the Great Pacific Garbage Patch?',
          options: ['Size of California', 'Twice the size of Texas', 'Size of Rhode Island', 'Size of Alaska'],
          correctAnswer: 1,
          explanation: 'The Great Pacific Garbage Patch is estimated to be twice the size of Texas and continues growing.'
        }
      ]
    };

    const categoryQuizzes = quizzes[lessonData.category as keyof typeof quizzes] || [];
    return categoryQuizzes;
  };

  const simulateTyping = (message: string, callback: () => void) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, Math.min(message.length * 50, 3000));
  };

    const askAI = async (message:string) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/chat",
        {
          message,
          lessonData
        }
      );

      return res.data.answer;
    } catch (err) {
      return "Sorry, I couldn't generate a response.";
    }
  }; 
    const handleSendMessage = () => {
      if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Generate AI response
    simulateTyping(inputMessage, async() => {
      const aiText = await askAI(inputMessage);

      const aiResponse :Message={
        id: Date.now().toString(),
        type: "ai",
        content: aiText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    });
  };

  const handleQuizAnswer = (answerIndex: number) => {
    if (!currentQuiz || !quizSession) return;

    setSelectedAnswer(answerIndex);
    
    // Update quiz session
    const newAnswers = [...quizSession.answers];
    newAnswers[quizSession.currentQuestionIndex] = answerIndex;
    
    const isCorrect = answerIndex === currentQuiz.correctAnswer;
    const newScore = quizSession.score + (isCorrect ? 1 : 0);
    
    const updatedSession = {
      ...quizSession,
      answers: newAnswers,
      score: newScore
    };
    
    setQuizSession(updatedSession);
    setShowQuizResult(true);

    // Show result and move to next question after delay
    setTimeout(() => {
      setShowQuizResult(false);
      setSelectedAnswer(null);
      
      const nextQuestionIndex = quizSession.currentQuestionIndex + 1;
      
      if (nextQuestionIndex < quizSession.questions.length) {
        // Move to next question
        updatedSession.currentQuestionIndex = nextQuestionIndex;
        setQuizSession(updatedSession);
        setCurrentQuiz(quizSession.questions[nextQuestionIndex]);
        
        const nextQuestionMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: `**Question ${nextQuestionIndex + 1} of ${quizSession.questions.length}:**`,
          timestamp: new Date(),
          quiz: quizSession.questions[nextQuestionIndex]
        };
        
        setMessages(prev => [...prev, nextQuestionMessage]);
      } else {
        // Quiz completed
        updatedSession.isCompleted = true;
        updatedSession.endTime = new Date();
        setQuizSession(updatedSession);
        setCurrentQuiz(null);
        setConversationStage('completed');
        setShowQuizResults(true);
      }
    }, 2500);
  };

  const getGrade = (percentage: number): { grade: string; color: string; description: string } => {
    if (percentage >= 95) return { grade: 'A+', color: 'text-emerald-600', description: 'Outstanding!' };
    if (percentage >= 90) return { grade: 'A', color: 'text-emerald-600', description: 'Excellent!' };
    if (percentage >= 85) return { grade: 'A-', color: 'text-emerald-500', description: 'Great job!' };
    if (percentage >= 80) return { grade: 'B+', color: 'text-blue-600', description: 'Good work!' };
    if (percentage >= 75) return { grade: 'B', color: 'text-blue-600', description: 'Well done!' };
    if (percentage >= 70) return { grade: 'B-', color: 'text-blue-500', description: 'Nice effort!' };
    if (percentage >= 65) return { grade: 'C+', color: 'text-yellow-600', description: 'Keep improving!' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', description: 'Room for growth!' };
    return { grade: 'D', color: 'text-red-600', description: 'Try again!' };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const categoryIcons = {
    water: Droplets,
    energy: Sun,
    waste: Recycle,
    nature: TreePine
  };

  const CategoryIcon = categoryIcons[lessonData.category as keyof typeof categoryIcons] || Leaf;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      {showFloatingElements && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute opacity-20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0.1, 0.3, 0.1],
                scale: [0.8, 1.2, 0.8],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 8 + i * 2, 
                repeat: Infinity,
                delay: i * 0.5 
              }}
              style={{
                left: `${15 + i * 12}%`,
                top: `${10 + (i % 3) * 30}%`,
              }}
            >
              <CategoryIcon size={24} className="text-emerald-400" />
            </motion.div>
          ))}
        </>
      )}

      {/* Header */}
      <motion.div 
        className="bg-white/80 backdrop-blur-sm border-b border-emerald-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Lessons
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Bot className="text-emerald-600" size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Tutor Chat</h1>
                <p className="text-sm text-emerald-600">{lessonData.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                {conversationStage}
              </Badge>
              {learningProgress > 0 && (
                <div className="flex items-center gap-2">
                  <Progress value={learningProgress} className="w-20 h-2" />
                  <span className="text-xs text-emerald-600">{learningProgress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-6 py-6 h-[calc(100vh-120px)] flex flex-col">
        {/* Messages */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto space-y-4 mb-6 scroll-smooth"
        >
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {/* Message Content */}
                <Card className={`${
                  message.type === 'user' 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-white border-emerald-100'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        message.type === 'user' 
                          ? 'bg-emerald-500' 
                          : 'bg-emerald-100'
                      }`}>
                        {message.type === 'user' ? (
                          <User size={16} className="text-white" />
                        ) : (
                          <Bot size={16} className="text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`${
                          message.type === 'user' ? 'text-white' : 'text-gray-800'
                        } whitespace-pre-wrap leading-relaxed`}>
                          {message.content}
                        </div>
                        <div className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-emerald-100' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resources */}
                {message.resources && message.resources.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3 space-y-2"
                  >
                    <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <BookOpen size={16} />
                      Study Resources
                    </h4>
                    {message.resources.map((resource, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto p-3 border-blue-200 hover:bg-blue-50"
                          onClick={() => window.open(resource.url, '_blank')}
                        >
                          <div className="flex items-start gap-3 text-left">
                            <ExternalLink size={16} className="text-blue-600 mt-1" />
                            <div>
                              <div className="font-medium text-blue-700">{resource.title}</div>
                              <div className="text-xs text-blue-600 mt-1">{resource.description}</div>
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Quiz Question */}
                {message.quiz && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3"
                  >
                    <Card className="border-purple-200 bg-purple-50">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-purple-800 mb-3">{message.quiz.question}</h4>
                        <div className="space-y-2">
                          {message.quiz.options.map((option, idx) => (
                            <Button
                              key={idx}
                              variant={selectedAnswer === idx ? "default" : "outline"}
                              className={`w-full justify-start ${
                                selectedAnswer === idx 
                                  ? "bg-purple-600 text-white" 
                                  : "border-purple-200 text-purple-700 hover:bg-purple-50"
                              }`}
                              onClick={() => handleQuizAnswer(idx)}
                              disabled={showQuizResult}
                            >
                              <span className="mr-3 font-medium">{String.fromCharCode(65 + idx)}.</span>
                              {option}
                            </Button>
                          ))}
                        </div>
                        
                        {showQuizResult && currentQuiz && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 rounded-lg bg-white border-2 border-purple-200"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {selectedAnswer === currentQuiz.correctAnswer ? (
                                <CheckCircle className="text-green-600" size={20} />
                              ) : (
                                <X className="text-red-600" size={20} />
                              )}
                              <span className={`font-medium ${
                                selectedAnswer === currentQuiz.correctAnswer 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {selectedAnswer === currentQuiz.correctAnswer ? 'Correct!' : 'Incorrect'}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">{currentQuiz.explanation}</p>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <Card className="bg-white border-emerald-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <Bot size={16} className="text-emerald-600" />
                    </div>
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg border border-emerald-200 p-4"
        >
          <div className="flex gap-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about this topic..."
              className="flex-1 border-emerald-200 focus:border-emerald-400"
              disabled={currentQuiz !== null}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || currentQuiz !== null}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send size={16} />
            </Button>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage('begin lesson')}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <BookOpen size={14} className="mr-1" />
              Begin Lesson
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage('study resources')}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <ExternalLink size={14} className="mr-1" />
              Study Resources
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage('take quiz')}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Brain size={14} className="mr-1" />
              Take Quiz
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Quiz Results Dialog */}
      <Dialog open={showQuizResults} onOpenChange={setShowQuizResults}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="text-yellow-500" size={24} />
              Quiz Completed!
            </DialogTitle>
            <DialogDescription>
              Here are your comprehensive quiz results
            </DialogDescription>
          </DialogHeader>
          
          {quizSession && (
            <div className="space-y-6">
              {/* Score Overview */}
              <div className="text-center space-y-3">
                <div className="text-4xl font-bold text-emerald-600">
                  {quizSession.score} / {quizSession.questions.length}
                </div>
                <div className="text-2xl text-gray-600">
                  {Math.round((quizSession.score / quizSession.questions.length) * 100)}%
                </div>
                
                {(() => {
                  const percentage = (quizSession.score / quizSession.questions.length) * 100;
                  const gradeInfo = getGrade(percentage);
                  return (
                    <div className="space-y-2">
                      <div className={`text-3xl font-bold ${gradeInfo.color}`}>
                        {gradeInfo.grade}
                      </div>
                      <div className={`text-lg ${gradeInfo.color}`}>
                        {gradeInfo.description}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Eco Points Earned */}
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="text-emerald-600" size={20} />
                  <span className="font-medium text-emerald-800">Eco Points Earned!</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  +{quizSession.score * 10} points
                </div>
                <div className="text-sm text-emerald-600 mt-1">
                  Great job on completing the assessment!
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowQuizResults(false);
                    setQuizSession(null);
                    setConversationStage('intro');
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Continue Learning
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset quiz
                    const newQuiz = generateComprehensiveQuiz();
                    const newSession: QuizSession = {
                      questions: newQuiz,
                      currentQuestionIndex: 0,
                      answers: new Array(newQuiz.length).fill(null),
                      score: 0,
                      isCompleted: false,
                      startTime: new Date()
                    };
                    setQuizSession(newSession);
                    setCurrentQuiz(newQuiz[0]);
                    setShowQuizResults(false);
                    setConversationStage('quiz');
                  }}
                  className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Retake Quiz
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EcoAI;