
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { MapPin, Info, Map } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

type CampusLocation = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  mapCoordinates?: {
    lat: number;
    lng: number;
  };
  features?: string[];
  hours?: string;
};

const CampusTourPage = () => {
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from Firebase if available
      const locationsCollection = collection(firestore, "campusLocations");
      const querySnapshot = await getDocs(locationsCollection);
      
      if (!querySnapshot.empty) {
        const fetchedLocations: CampusLocation[] = [];
        querySnapshot.forEach((doc) => {
          fetchedLocations.push({
            id: doc.id,
            ...doc.data() as Omit<CampusLocation, 'id'>
          });
        });
        setLocations(fetchedLocations);
      } else {
        // Use fallback demo data if no data in Firebase
        setLocations(demoLocations);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      // Use fallback demo data on error
      setLocations(demoLocations);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: "all", name: "All Locations" },
    { id: "academic", name: "Academic Buildings" },
    { id: "housing", name: "Housing" },
    { id: "dining", name: "Dining" },
    { id: "recreation", name: "Recreation" },
    { id: "services", name: "Services" },
  ];

  const filteredLocations = activeCategory === "all" 
    ? locations 
    : locations.filter(location => location.category === activeCategory);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Campus Tour</h1>
        <p className="text-muted-foreground mt-2">Explore key locations around campus</p>
      </div>

      <div className="mb-8 bg-card shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to Our Campus</h2>
          <p className="max-w-3xl mx-auto text-muted-foreground">
            Our campus spans over 200 acres with state-of-the-art facilities for academics, 
            research, housing, recreation, and more. Use this virtual tour to familiarize 
            yourself with key locations before visiting in person.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card shadow rounded-lg p-4 sticky top-24">
            <h3 className="font-medium mb-3">Filter Locations</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeCategory === category.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="font-medium mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Academic Buildings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Housing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Dining</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Recreation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Services</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredLocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLocations.map((location) => (
                <Card key={location.id} className="overflow-hidden">
                  <div className="relative h-48 w-full">
                    <img
                      src={location.imageUrl}
                      alt={location.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/1e293b?text=Campus+Location";
                      }}
                    />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-white text-xs ${
                      getCategoryColor(location.category)
                    }`}>
                      {getCategoryName(location.category)}
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle>{location.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {location.mapCoordinates ? 'View on Map' : 'Location details coming soon'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="mb-4">{location.description}</p>
                    
                    {location.hours && (
                      <div className="flex items-start gap-2 text-sm mb-2">
                        <div className="flex-shrink-0 mt-1">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="font-medium">Hours:</span> {location.hours}
                        </div>
                      </div>
                    )}
                    
                    {location.features && location.features.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm font-medium">Features:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {location.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="bg-muted text-xs px-2 py-1 rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-card rounded-lg shadow">
              <Map className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium mt-4">No locations found</h3>
              <p className="text-muted-foreground mt-1">
                No locations match the current filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getCategoryColor(category: string): string {
  switch (category) {
    case 'academic':
      return 'bg-blue-500';
    case 'housing':
      return 'bg-green-500';
    case 'dining':
      return 'bg-yellow-500';
    case 'recreation':
      return 'bg-purple-500';
    case 'services':
      return 'bg-red-500';
    default:
      return 'bg-slate-500';
  }
}

function getCategoryName(categoryId: string): string {
  switch (categoryId) {
    case 'academic':
      return 'Academic';
    case 'housing':
      return 'Housing';
    case 'dining':
      return 'Dining';
    case 'recreation':
      return 'Recreation';
    case 'services':
      return 'Services';
    default:
      return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  }
}

// Demo data in case Firebase doesn't have any
const demoLocations: CampusLocation[] = [
  {
    id: "1",
    name: "Main Library",
    description: "Our flagship library houses over 2 million books and provides quiet study spaces, group collaboration rooms, and digital resources.",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
    category: "academic",
    features: ["Study Rooms", "Computer Lab", "Quiet Zones", "Coffee Shop"],
    hours: "Monday-Friday: 7am-11pm, Weekends: 9am-9pm"
  },
  {
    id: "2",
    name: "Science Building",
    description: "Home to the departments of Biology, Chemistry, Physics and Astronomy, featuring state-of-the-art laboratories and research facilities.",
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585",
    category: "academic",
    features: ["Research Labs", "Lecture Halls", "Observatory", "Computer Labs"],
    hours: "Monday-Friday: 6am-10pm, Weekends: 8am-6pm"
  },
  {
    id: "3",
    name: "North Residence Hall",
    description: "Modern dormitory featuring suite-style rooms with shared common spaces, kitchenettes, and laundry facilities on each floor.",
    imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5",
    category: "housing",
    features: ["Suite-Style Rooms", "Study Lounges", "Laundry", "TV Lounge"],
    hours: "24/7 Access for Residents"
  },
  {
    id: "4",
    name: "University Center",
    description: "The heart of campus social life, housing dining options, student organization offices, recreational facilities, and event spaces.",
    imageUrl: "https://images.unsplash.com/photo-1591088398332-8a7791972843",
    category: "services",
    features: ["Food Court", "Ballroom", "Meeting Rooms", "Student Offices"],
    hours: "Monday-Sunday: 7am-12am"
  },
  {
    id: "5",
    name: "Campus Dining Hall",
    description: "The main dining facility offering a variety of food stations with options for all dietary needs and preferences.",
    imageUrl: "https://images.unsplash.com/photo-1544965850-6f9a25bdc1a3",
    category: "dining",
    features: ["Vegetarian Options", "Allergen-Free Station", "Made-to-Order", "International Cuisine"],
    hours: "Breakfast: 7am-10am, Lunch: 11am-2pm, Dinner: 5pm-8pm"
  },
  {
    id: "6",
    name: "Recreation Center",
    description: "Comprehensive fitness facility featuring a swimming pool, basketball courts, weight room, indoor track, and group exercise studios.",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
    category: "recreation",
    features: ["Swimming Pool", "Fitness Classes", "Weight Room", "Basketball Courts", "Climbing Wall"],
    hours: "Monday-Friday: 6am-11pm, Weekends: 8am-9pm"
  },
  {
    id: "7",
    name: "Engineering Complex",
    description: "Cutting-edge facility for engineering education and research, with specialized labs, maker spaces, and industry collaboration areas.",
    imageUrl: "https://images.unsplash.com/photo-1581092921461-eab10380447b",
    category: "academic",
    features: ["Robotics Lab", "3D Printing", "Electronics Workshop", "Computer Labs"],
    hours: "Monday-Friday: 7am-10pm, Weekends: 9am-6pm"
  },
  {
    id: "8",
    name: "Student Health Center",
    description: "Comprehensive healthcare facility providing medical services, counseling, health education, and wellness programs.",
    imageUrl: "https://images.unsplash.com/photo-1538108149393-fbbd81895907",
    category: "services",
    features: ["Medical Clinic", "Counseling Services", "Pharmacy", "Health Education"],
    hours: "Monday-Friday: 8am-5pm, Saturday: 10am-2pm (Urgent Care Only)"
  }
];

export default CampusTourPage;
