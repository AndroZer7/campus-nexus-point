
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Calendar, Pin, Info, Trash2 } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, deleteDoc, doc, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

const noticeSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  content: z.string().min(10, { message: "Content must be at least 10 characters." }),
  category: z.string().min(1, { message: "Category is required." }),
  priority: z.enum(["low", "medium", "high"], { required_error: "Priority is required." }),
  expiryDate: z.string().optional(),
});

type Notice = {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high";
  expiryDate?: string;
  createdAt: Date;
  createdBy: string;
  createdById: string;
};

const NoticeBoardPage = () => {
  const { userProfile } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof noticeSchema>>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      priority: "medium",
      expiryDate: "",
    },
  });
  
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const noticesCollection = collection(firestore, "notices");
      const q = query(noticesCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedNotices: Notice[] = [];
      const now = new Date();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Skip expired notices
        if (data.expiryDate) {
          const expiryDate = new Date(data.expiryDate);
          if (expiryDate < now) return;
        }
        
        fetchedNotices.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          category: data.category,
          priority: data.priority,
          expiryDate: data.expiryDate,
          createdAt: data.createdAt.toDate(),
          createdBy: data.createdBy,
          createdById: data.createdById,
        });
      });
      
      setNotices(fetchedNotices);
    } catch (error) {
      console.error("Error fetching notices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notices. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof noticeSchema>) => {
    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be signed in to post notices.",
      });
      return;
    }

    if (!userProfile.isAdmin && !userProfile.isFaculty) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "Only faculty and admin can post notices.",
      });
      return;
    }

    try {
      await addDoc(collection(firestore, "notices"), {
        ...data,
        createdAt: Timestamp.now(),
        createdBy: userProfile.displayName,
        createdById: userProfile.uid,
      });
      
      toast({
        title: "Notice Posted",
        description: "The notice has been successfully posted.",
      });
      
      setOpen(false);
      form.reset();
      fetchNotices();
    } catch (error) {
      console.error("Error posting notice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post notice. Please try again.",
      });
    }
  };

  const deleteNotice = async (noticeId: string) => {
    try {
      await deleteDoc(doc(firestore, "notices", noticeId));
      toast({
        title: "Notice Deleted",
        description: "The notice has been successfully deleted.",
      });
      setNotices(notices.filter(notice => notice.id !== noticeId));
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete notice. Please try again.",
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canPostNotice = () => {
    return userProfile && (userProfile.isAdmin || userProfile.isFaculty);
  };

  const canDeleteNotice = (notice: Notice) => {
    return userProfile && (userProfile.uid === notice.createdById || userProfile.isAdmin);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      default:
        return 'bg-green-500';
    }
  };

  // Filter and search notices
  const filteredNotices = notices.filter((notice) => {
    // Apply category filter
    if (categoryFilter !== 'all' && notice.category !== categoryFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return notice.title.toLowerCase().includes(query) || 
             notice.content.toLowerCase().includes(query);
    }
    
    return true;
  });

  // Get unique categories from notices
  const categories = ['all', ...Array.from(new Set(notices.map(notice => notice.category)))];

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notice Board</h1>
          <p className="text-muted-foreground mt-2">Important announcements and information</p>
        </div>
        
        {canPostNotice() && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <Plus className="mr-2 h-4 w-4" />
                Post Notice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Post a New Notice</DialogTitle>
                <DialogDescription>
                  Create an announcement for the campus community.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notice Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter notice title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="academic">Academic</SelectItem>
                                <SelectItem value="administrative">Administrative</SelectItem>
                                <SelectItem value="events">Events</SelectItem>
                                <SelectItem value="examination">Examination</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="campus">Campus</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter notice content" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit">Post Notice</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Filter Notices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input 
                  placeholder="Search notices..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Low Priority</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotices.length > 0 ? (
            <div className="space-y-6">
              {filteredNotices.map((notice) => (
                <Card key={notice.id} className="shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{notice.title}</CardTitle>
                        <CardDescription>
                          {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)} • {formatDate(notice.createdAt)}
                        </CardDescription>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(notice.priority)}`} />
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="whitespace-pre-wrap">{notice.content}</div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Posted: {formatDate(notice.createdAt)}
                      </Badge>
                      
                      {notice.expiryDate && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires: {formatDate(new Date(notice.expiryDate))}
                        </Badge>
                      )}
                      
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Priority: {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t bg-muted/10 px-6 py-3">
                    <div className="text-sm text-muted-foreground">
                      Posted by: {notice.createdBy}
                    </div>
                    
                    {canDeleteNotice(notice) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteNotice(notice.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-card rounded-lg shadow">
              <Pin className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium mt-4">No notices found</h3>
              <p className="text-muted-foreground mt-1">
                {categoryFilter === 'all' && !searchQuery 
                  ? "No notices are currently posted." 
                  : "No notices match your filters."}
              </p>
              {canPostNotice() && (
                <Button onClick={() => setOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Post Notice
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeBoardPage;
