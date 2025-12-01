// app/(routes)/dashboard/articles/page.tsx
"use client"
import React, { useState, useMemo } from 'react'
import { Search, Filter, Calendar, Clock, Tag, ChevronRight, BookOpen, Heart, Brain, Activity, Stethoscope, Apple, Shield, Sun, Moon, X, Dumbbell, Baby, Users, Pill, Eye, Ear, Smile } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Comprehensive health articles across all categories
const articlesData = [
  // Neurological & Mental Health
  {
    id: 1,
    title: "Understanding Different Types of Headaches and Their Triggers",
    category: "Neurology",
    tags: ["headaches", "migraines", "tension", "cluster headaches"],
    excerpt: "Learn to identify different headache types, their unique characteristics, common triggers, and evidence-based management strategies for each type.",
    readTime: 8,
    date: "2024-01-20",
    image: "/api/placeholder/400/250",
    featured: true,
    difficulty: "Beginner"
  },
  {
    id: 2,
    title: "Managing Anxiety: Practical Techniques That Actually Work",
    category: "Mental Health",
    tags: ["anxiety", "stress management", "breathing exercises", "mindfulness"],
    excerpt: "Evidence-based strategies for managing anxiety, including cognitive techniques, breathing exercises, and lifestyle modifications that can make a real difference.",
    readTime: 10,
    date: "2024-01-19",
    image: "/api/placeholder/400/250",
    difficulty: "Intermediate"
  },
  
  // Cardiovascular Health
  {
    id: 3,
    title: "Blood Pressure: What Your Numbers Really Mean",
    category: "Cardiovascular",
    tags: ["blood pressure", "hypertension", "heart health", "monitoring"],
    excerpt: "Decode your blood pressure readings, understand what affects them, and learn how to maintain healthy levels through lifestyle choices.",
    readTime: 6,
    date: "2024-01-18",
    image: "/api/placeholder/400/250",
    featured: true,
    difficulty: "Beginner"
  },
  {
    id: 4,
    title: "Heart Rate Variability: Your Body's Hidden Health Metric",
    category: "Cardiovascular",
    tags: ["HRV", "heart health", "stress", "fitness tracking"],
    excerpt: "Discover how heart rate variability reflects your overall health, stress levels, and fitness, plus how to improve it naturally.",
    readTime: 7,
    date: "2024-01-17",
    image: "/api/placeholder/400/250",
    difficulty: "Advanced"
  },
  
  // Nutrition & Diet
  {
    id: 5,
    title: "The Mediterranean Diet: Science-Backed Benefits Explained",
    category: "Nutrition",
    tags: ["mediterranean diet", "healthy eating", "heart health", "longevity"],
    excerpt: "Explore the research behind the Mediterranean diet's benefits for heart health, brain function, and longevity, with practical implementation tips.",
    readTime: 9,
    date: "2024-01-16",
    image: "/api/placeholder/400/250",
    difficulty: "Beginner"
  },
  {
    id: 6,
    title: "Intermittent Fasting: Benefits, Risks, and How to Start Safely",
    category: "Nutrition",
    tags: ["intermittent fasting", "weight management", "metabolism", "eating patterns"],
    excerpt: "A comprehensive guide to intermittent fasting, including different methods, potential benefits, who should avoid it, and safe implementation strategies.",
    readTime: 12,
    date: "2024-01-15",
    image: "/api/placeholder/400/250",
    difficulty: "Intermediate"
  },
  
  // Exercise & Fitness
  {
    id: 7,
    title: "Building Strength After 50: Safe and Effective Training",
    category: "Fitness",
    tags: ["strength training", "aging", "muscle health", "bone density"],
    excerpt: "Age-appropriate strength training techniques to maintain muscle mass, improve bone density, and enhance quality of life for older adults.",
    readTime: 8,
    date: "2024-01-14",
    image: "/api/placeholder/400/250",
    difficulty: "Intermediate"
  },
  {
    id: 8,
    title: "The Science of Recovery: Why Rest Days Matter",
    category: "Fitness",
    tags: ["recovery", "rest days", "muscle growth", "injury prevention"],
    excerpt: "Understanding the biological processes during recovery, signs of overtraining, and how to optimize rest for better fitness results.",
    readTime: 6,
    date: "2024-01-13",
    image: "/api/placeholder/400/250",
    difficulty: "Beginner"
  },
  
  // Sleep & Recovery
  {
    id: 9,
    title: "Sleep Hygiene: Creating the Perfect Sleep Environment",
    category: "Sleep Health",
    tags: ["sleep", "insomnia", "sleep hygiene", "circadian rhythm"],
    excerpt: "Transform your bedroom and bedtime routine with evidence-based strategies for better sleep quality and duration.",
    readTime: 7,
    date: "2024-01-12",
    image: "/api/placeholder/400/250",
    featured: true,
    difficulty: "Beginner"
  },
  {
    id: 10,
    title: "Understanding Sleep Cycles and Their Impact on Health",
    category: "Sleep Health",
    tags: ["sleep cycles", "REM sleep", "deep sleep", "sleep stages"],
    excerpt: "Dive deep into the science of sleep stages, what happens in each cycle, and how to optimize your sleep architecture for better health.",
    readTime: 10,
    date: "2024-01-11",
    image: "/api/placeholder/400/250",
    difficulty: "Advanced"
  },
  
  // Women's Health
  {
    id: 11,
    title: "Hormonal Health Throughout Life: A Woman's Guide",
    category: "Women's Health",
    tags: ["hormones", "menstrual health", "menopause", "PCOS"],
    excerpt: "Navigate hormonal changes from puberty through menopause, understanding symptoms, treatments, and when to seek medical advice.",
    readTime: 11,
    date: "2024-01-10",
    image: "/api/placeholder/400/250",
    difficulty: "Intermediate"
  },
  {
    id: 12,
    title: "Bone Health: Prevention and Management of Osteoporosis",
    category: "Women's Health",
    tags: ["osteoporosis", "bone density", "calcium", "vitamin D"],
    excerpt: "Comprehensive strategies for maintaining strong bones throughout life, including nutrition, exercise, and medical screening recommendations.",
    readTime: 8,
    date: "2024-01-09",
    image: "/api/placeholder/400/250",
    difficulty: "Intermediate"
  },
  
  // Men's Health
  {
    id: 13,
    title: "Prostate Health: What Every Man Should Know",
    category: "Men's Health",
    tags: ["prostate", "screening", "BPH", "prevention"],
    excerpt: "Essential information about prostate health, common conditions, screening guidelines, and lifestyle factors that influence prostate wellness.",
    readTime: 7,
    date: "2024-01-08",
    image: "/api/placeholder/400/250",
    difficulty: "Beginner"
  },
  {
    id: 14,
    title: "Testosterone and Aging: Myths vs. Facts",
    category: "Men's Health",
    tags: ["testosterone", "hormones", "aging", "vitality"],
    excerpt: "Separating fact from fiction about testosterone decline with age, symptoms of low T, and evidence-based approaches to hormonal health.",
    readTime: 9,
    date: "2024-01-07",
    image: "/api/placeholder/400/250",
    difficulty: "Intermediate"
  },
  
  // Digestive Health
  {
    id: 15,
    title: "Gut Health 101: Your Microbiome and Overall Wellness",
    category: "Digestive Health",
    tags: ["gut health", "microbiome", "probiotics", "digestion"],
    excerpt: "Explore the fascinating world of your gut microbiome and its far-reaching effects on immunity, mental health, and chronic disease.",
    readTime: 10,
    date: "2024-01-06",
    image: "/api/placeholder/400/250",
    featured: true,
    difficulty: "Intermediate"
  },
  {
    id: 16,
    title: "IBS Management: Dietary and Lifestyle Strategies",
    category: "Digestive Health",
    tags: ["IBS", "FODMAP", "digestive disorders", "symptom management"],
    excerpt: "Practical approaches to managing irritable bowel syndrome, including the low-FODMAP diet, stress reduction, and trigger identification.",
    readTime: 8,
    date: "2024-01-05",
    image: "/api/placeholder/400/250",
    difficulty: "Intermediate"
  },
  
  // Preventive Care
  {
    id: 17,
    title: "Health Screening by Age: Your Prevention Timeline",
    category: "Preventive Care",
    tags: ["screening", "prevention", "check-ups", "early detection"],
    excerpt: "Age-specific guide to recommended health screenings and preventive care measures throughout your lifetime.",
    readTime: 12,
    date: "2024-01-04",
    image: "/api/placeholder/400/250",
    difficulty: "Beginner"
  },
  {
    id: 18,
    title: "Vaccination Guide for Adults: Beyond Childhood Shots",
    category: "Preventive Care",
    tags: ["vaccines", "immunization", "prevention", "adult health"],
    excerpt: "Understanding which vaccines adults need, when to get them, and why they're important for maintaining health throughout life.",
    readTime: 6,
    date: "2024-01-03",
    image: "/api/placeholder/400/250",
    difficulty: "Beginner"
  },
  
  // Children's Health
  {
    id: 19,
    title: "Childhood Development Milestones: What to Expect",
    category: "Pediatric Health",
    tags: ["child development", "milestones", "growth", "pediatrics"],
    excerpt: "Track your child's physical, cognitive, and emotional development with this comprehensive guide to pediatric milestones.",
    readTime: 10,
    date: "2024-01-02",
    image: "/api/placeholder/400/250",
    difficulty: "Beginner"
  },
  {
    id: 20,
    title: "Building Healthy Habits in Children: A Parent's Guide",
    category: "Pediatric Health",
    tags: ["children", "healthy habits", "parenting", "nutrition"],
    excerpt: "Evidence-based strategies for instilling healthy eating, exercise, and sleep habits in children that last a lifetime.",
    readTime: 8,
    date: "2024-01-01",
    image: "/api/placeholder/400/250",
    difficulty: "Beginner"
  }
]

// Comprehensive categories covering all health aspects
const categories = [
  { value: "all", label: "All Categories", icon: BookOpen, color: "text-gray-600" },
  { value: "neurology", label: "Neurology", icon: Brain, color: "text-purple-600" },
  { value: "mental-health", label: "Mental Health", icon: Smile, color: "text-green-600" },
  { value: "cardiovascular", label: "Cardiovascular", icon: Heart, color: "text-red-600" },
  { value: "nutrition", label: "Nutrition", icon: Apple, color: "text-orange-600" },
  { value: "fitness", label: "Fitness", icon: Dumbbell, color: "text-blue-600" },
  { value: "sleep-health", label: "Sleep Health", icon: Moon, color: "text-indigo-600" },
  { value: "womens-health", label: "Women's Health", icon: Users, color: "text-pink-600" },
  { value: "mens-health", label: "Men's Health", icon: Shield, color: "text-cyan-600" },
  { value: "digestive-health", label: "Digestive Health", icon: Activity, color: "text-yellow-600" },
  { value: "preventive-care", label: "Preventive Care", icon: Stethoscope, color: "text-teal-600" },
  { value: "pediatric-health", label: "Pediatric Health", icon: Baby, color: "text-purple-500" }
]

export default function HealthArticlesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  
  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    let filtered = articlesData
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(article => 
        article.category.toLowerCase().replace(/[\s']/g, "-") === selectedCategory
      )
    }
    
    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(article => 
        article.difficulty?.toLowerCase() === difficultyFilter
      )
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortBy === "readTime") {
        return a.readTime - b.readTime
      } else if (sortBy === "alphabetical") {
        return a.title.localeCompare(b.title)
      }
      return 0
    })
    
    return filtered
  }, [searchQuery, selectedCategory, sortBy, difficultyFilter])
  
  const featuredArticles = filteredArticles.filter(a => a.featured)
  const regularArticles = filteredArticles.filter(a => !a.featured)
  
  // Popular search suggestions
  const popularSearches = [
    "headaches", "sleep", "anxiety", "diet", "exercise", 
    "heart health", "diabetes", "stress", "vitamins", "back pain"
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bathusi-AI Health Library
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto"> 
            Empowering you with knowledge for better health decisions.
          </p>
        </div>
        
        {/* Search and Filters */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Enhanced Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search health topics, symptoms, conditions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-56 h-12">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              
              {/* Difficulty Filter */}
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full lg:w-40 h-12">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-40 h-12">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Latest First</SelectItem>
                  <SelectItem value="readTime">Quick Reads</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Popular Search Suggestions */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm text-gray-600">Popular:</span>
              {popularSearches.map((term) => (
                <Badge
                  key={term}
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => setSearchQuery(term)}
                >
                  {term}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Category Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {categories.slice(1, 7).map((cat) => {
            const Icon = cat.icon
            return (
              <Card
                key={cat.value}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedCategory(cat.value)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${cat.color}`} />
                  <p className="text-sm font-medium">{cat.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found <span className="font-semibold text-gray-900">{filteredArticles.length}</span> articles
            {searchQuery && ` for "${searchQuery}"`}
            {selectedCategory !== "all" && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
          </p>
        </div>
        
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-yellow-500">★</span> Featured Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-blue-100 to-purple-100 h-48 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-blue-300" />
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{article.category}</Badge>
                      {article.difficulty && (
                        <Badge variant="outline">{article.difficulty}</Badge>
                      )}
                      <span className="text-sm text-gray-500 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {article.readTime} min
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2 mb-4">{article.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Regular Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularArticles.map((article) => (
            <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-100 to-gray-200 h-40 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {(() => {
                    const cat = categories.find(c => 
                      article.category.toLowerCase().replace(/[\s']/g, "-") === c.value
                    )
                    const Icon = cat?.icon || BookOpen
                    return <Icon className={`w-12 h-12 ${cat?.color || 'text-gray-400'} opacity-50`} />
                  })()}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">{article.category}</Badge>
                  {article.difficulty && (
                    <Badge variant="secondary" className="text-xs">{article.difficulty}</Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{article.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(article.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime} min
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* No Results */}
        {filteredArticles.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <Button onClick={() => {
              setSearchQuery("")
              setSelectedCategory("all")
              setDifficultyFilter("all")
            }}>
              Clear Filters
            </Button>
          </Card>
        )}
        
        {/* Disclaimer */}
        <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 text-center">
            <strong>Medical Disclaimer:</strong> The content in these articles is for educational and informational purposes only. 
            It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. 
            Always seek the advice of your physician or other qualified health provider with any questions you may have.
          </p>
        </div>
      </div>
    </div>
  )
}