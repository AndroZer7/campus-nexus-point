
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Search, MessageSquare, Bell, Clipboard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const HomePage: React.FC = () => {
  const { currentUser, signInWithGoogle } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-campus-purple/10 to-campus-soft-blue/20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-campus-purple to-campus-purple-dark bg-clip-text text-transparent">
            Welcome to Campus Nexus
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-foreground/80">
            Your central hub for campus events, discussions, resources, and community.
          </p>

          {!currentUser ? (
            <Button onClick={signInWithGoogle} size="lg" className="bg-campus-purple hover:bg-campus-purple-dark text-white">
              Sign In with Google
            </Button>
          ) : (
            <div className="flex justify-center space-x-4">
              <Button asChild size="lg" className="bg-campus-purple hover:bg-campus-purple-dark text-white">
                <Link to="/events">Browse Events</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/discussions">Join Discussions</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Discover Campus Nexus Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <Calendar className="h-8 w-8 text-campus-purple mb-2" />
                <CardTitle className="text-xl">Events</CardTitle>
                <CardDescription>
                  Stay updated with campus events and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Never miss important campus events with notifications, calendar integration, and event details.
                </p>
                <Button asChild variant="ghost" className="text-campus-purple hover:text-campus-purple-dark hover:bg-campus-purple/10">
                  <Link to="/events">Explore Events</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <Search className="h-8 w-8 text-campus-purple mb-2" />
                <CardTitle className="text-xl">Lost & Found</CardTitle>
                <CardDescription>
                  Report and find lost items on campus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Post lost items or help reunite people with their belongings through our community lost and found.
                </p>
                <Button asChild variant="ghost" className="text-campus-purple hover:text-campus-purple-dark hover:bg-campus-purple/10">
                  <Link to="/lost-found">Lost & Found</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <MapPin className="h-8 w-8 text-campus-purple mb-2" />
                <CardTitle className="text-xl">Campus Tour</CardTitle>
                <CardDescription>
                  Interactive maps and virtual campus tours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Navigate campus with interactive maps, find building information, and explore campus landmarks.
                </p>
                <Button asChild variant="ghost" className="text-campus-purple hover:text-campus-purple-dark hover:bg-campus-purple/10">
                  <Link to="/campus-tour">Take a Tour</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <MessageSquare className="h-8 w-8 text-campus-purple mb-2" />
                <CardTitle className="text-xl">Discussions</CardTitle>
                <CardDescription>
                  Join topic-based threads and discussions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Engage with other students and faculty in organized discussion threads on various campus topics.
                </p>
                <Button asChild variant="ghost" className="text-campus-purple hover:text-campus-purple-dark hover:bg-campus-purple/10">
                  <Link to="/discussions">Join Discussions</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <Clipboard className="h-8 w-8 text-campus-purple mb-2" />
                <CardTitle className="text-xl">Notice Board</CardTitle>
                <CardDescription>
                  Important announcements and notices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access official announcements, deadlines, and important updates from campus administration.
                </p>
                <Button asChild variant="ghost" className="text-campus-purple hover:text-campus-purple-dark hover:bg-campus-purple/10">
                  <Link to="/notices">Visit Notice Board</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <Bell className="h-8 w-8 text-campus-purple mb-2" />
                <CardTitle className="text-xl">Notifications</CardTitle>
                <CardDescription>
                  Stay informed with personalized alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Receive alerts for event updates, replies to your discussions, lost item matches, and more.
                </p>
                <Button asChild variant="ghost" className="text-campus-purple hover:text-campus-purple-dark hover:bg-campus-purple/10">
                  <Link to="/notifications">View Notifications</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-campus-purple/90 to-campus-purple-dark/90 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join Your Campus Community?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Connect with fellow students, stay informed about campus events, and become an active member of your academic community.
          </p>
          {!currentUser ? (
            <Button onClick={signInWithGoogle} size="lg" className="bg-white text-campus-purple hover:bg-gray-100">
              Sign In with Google
            </Button>
          ) : (
            <Button asChild size="lg" className="bg-white text-campus-purple hover:bg-gray-100">
              <Link to="/profile">Complete Your Profile</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
