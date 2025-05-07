
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, MapPin, Calendar, User, Plus, Trash2 } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, deleteDoc, doc, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '@/lib/firebase';

const itemSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  location: z.string().min(3, { message: "Location is required" }),
  category: z.enum(["lost", "found"], { required_error: "Please select a category" }),
  date: z.string().refine(date => !isNaN(Date.parse(date)), { message: "Valid date is required" }),
  contactInfo: z.string().min(5, { message: "Contact information is required" }),
  image: z.instanceof(FileList).optional().refine(
    files => !files || files.length === 0 || (files.length === 1 && files[0].size <= 5000000), 
    { message: "Image is optional, but must be less than 5MB if provided" }
  ),
});

type LostFoundItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: "lost" | "found";
  date: string;
  contactInfo: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
};

const LostFoundPage = () => {
  const { userProfile } = useAuth();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      category: "lost",
      date: new Date().toISOString().split('T')[0],
      contactInfo: userProfile?.email || "",
    },
  });
  
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const itemsCollection = collection(firestore, "lostFound");
      const q = query(itemsCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedItems: LostFoundItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedItems.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          location: data.location,
          category: data.category,
          date: data.date,
          contactInfo: data.contactInfo,
          imageUrl: data.imageUrl,
          authorId: data.authorId,
          authorName: data.authorName,
          createdAt: data.createdAt.toDate(),
        });
      });
      
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load lost & found items. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `lostFound/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const onSubmit = async (data: z.infer<typeof itemSchema>) => {
    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be signed in to submit an item.",
      });
      return;
    }

    try {
      let imageUrl;
      if (data.image && data.image.length > 0) {
        imageUrl = await uploadImage(data.image[0]);
      }
      
      const itemData = {
        ...data,
        image: undefined, // Remove FileList before storing
        imageUrl,
        authorId: userProfile.uid,
        authorName: userProfile.displayName || "Anonymous",
        createdAt: Timestamp.now(),
        date: new Date(data.date).toISOString(),
      };
      
      await addDoc(collection(firestore, "lostFound"), itemData);
      
      toast({
        title: "Item Submitted",
        description: "Your lost & found item has been successfully submitted.",
      });
      
      setOpen(false);
      form.reset();
      fetchItems();
    } catch (error) {
      console.error("Error submitting item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit item. Please try again.",
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!userProfile) return;
    
    try {
      await deleteDoc(doc(firestore, "lostFound", itemId));
      
      toast({
        title: "Item Deleted",
        description: "The item has been successfully deleted.",
      });
      
      setItems(items.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete item. Please try again.",
      });
    }
  };

  const canDeleteItem = (item: LostFoundItem) => {
    return userProfile && (userProfile.uid === item.authorId || userProfile.isAdmin);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lostItems = filteredItems.filter(item => item.category === "lost");
  const foundItems = filteredItems.filter(item => item.category === "found");

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lost & Found</h1>
          <p className="text-muted-foreground mt-2">Find lost items or report items you've found</p>
        </div>
        
        {userProfile && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <Plus className="mr-2 h-4 w-4" />
                Submit Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Submit Lost or Found Item</DialogTitle>
                <DialogDescription>
                  Fill in the details to report a lost or found item.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lost">Lost Item</SelectItem>
                              <SelectItem value="found">Found Item</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of the item" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the item in detail" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Where lost/found" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="contactInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Information</FormLabel>
                        <FormControl>
                          <Input placeholder="Your email or phone number" {...field} />
                        </FormControl>
                        <FormDescription>
                          How someone can contact you about this item
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Image (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            {...fieldProps}
                            onChange={(event) => {
                              onChange(event.target.files);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Upload an image of the item (max 5MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit">Submit</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search for items..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="lost">Lost Items</TabsTrigger>
          <TabsTrigger value="found">Found Items</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {item.imageUrl && (
                    <div className="relative h-48 w-full">
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded text-white text-xs ${
                        item.category === 'lost' ? 'bg-red-500' : 'bg-green-500'
                      }`}>
                        {item.category === 'lost' ? 'Lost' : 'Found'}
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-1 flex items-center">
                      {!item.imageUrl && (
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          item.category === 'lost' ? 'bg-red-500' : 'bg-green-500'
                        }`} />
                      )}
                      {item.title}
                    </CardTitle>
                    <CardDescription className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(item.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm mb-4">{item.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {item.location}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <User className="h-4 w-4 mr-2" />
                        {item.contactInfo}
                      </div>
                    </div>
                  </CardContent>
                  {canDeleteItem(item) && (
                    <CardFooter className="border-t bg-muted/10 px-6 py-4">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No items found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search or submit a new item.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="lost" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : lostItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lostItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {/* Same card content as above */}
                  {item.imageUrl && (
                    <div className="relative h-48 w-full">
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-red-500 text-white text-xs">
                        Lost
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-1 flex items-center">
                      {!item.imageUrl && (
                        <span className="inline-block w-3 h-3 rounded-full mr-2 bg-red-500" />
                      )}
                      {item.title}
                    </CardTitle>
                    <CardDescription className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(item.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm mb-4">{item.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {item.location}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <User className="h-4 w-4 mr-2" />
                        {item.contactInfo}
                      </div>
                    </div>
                  </CardContent>
                  {canDeleteItem(item) && (
                    <CardFooter className="border-t bg-muted/10 px-6 py-4">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No lost items found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search or submit a new lost item.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="found" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : foundItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foundItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {/* Same card content as above */}
                  {item.imageUrl && (
                    <div className="relative h-48 w-full">
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-green-500 text-white text-xs">
                        Found
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-1 flex items-center">
                      {!item.imageUrl && (
                        <span className="inline-block w-3 h-3 rounded-full mr-2 bg-green-500" />
                      )}
                      {item.title}
                    </CardTitle>
                    <CardDescription className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(item.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm mb-4">{item.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {item.location}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <User className="h-4 w-4 mr-2" />
                        {item.contactInfo}
                      </div>
                    </div>
                  </CardContent>
                  {canDeleteItem(item) && (
                    <CardFooter className="border-t bg-muted/10 px-6 py-4">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No found items</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search or submit a new found item.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LostFoundPage;
