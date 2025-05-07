
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Edit, User } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const profileSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  bio: z.string().max(160, { message: 'Bio must not exceed 160 characters.' }).optional(),
  facebook: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  twitter: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  linkedin: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  instagram: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

const ProfilePage = () => {
  const { currentUser, userProfile, updateUserProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userProfile?.displayName || '',
      bio: userProfile?.bio || '',
      facebook: userProfile?.socialLinks?.facebook || '',
      twitter: userProfile?.socialLinks?.twitter || '',
      linkedin: userProfile?.socialLinks?.linkedin || '',
      instagram: userProfile?.socialLinks?.instagram || '',
    },
  });

  React.useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || '',
        bio: userProfile.bio || '',
        facebook: userProfile.socialLinks?.facebook || '',
        twitter: userProfile.socialLinks?.twitter || '',
        linkedin: userProfile.socialLinks?.linkedin || '',
        instagram: userProfile.socialLinks?.instagram || '',
      });
    }
  }, [userProfile, form]);

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      await updateUserProfile({
        displayName: data.displayName,
        bio: data.bio,
        socialLinks: {
          facebook: data.facebook,
          twitter: data.twitter,
          linkedin: data.linkedin,
          instagram: data.instagram,
        }
      });
      
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating your profile.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Please sign in to view and edit your profile.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-10">
            <Button>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>View and manage your profile information</CardDescription>
          </div>
          <Button 
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="ml-auto"
          >
            {isEditing ? "Cancel" : (
              <>
                <Edit className="w-4 h-4 mr-2" /> 
                Edit Profile
              </>
            )}
          </Button>
        </CardHeader>

        <CardContent>
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex justify-center mb-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || "User"} />
                    <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                  </Avatar>
                </div>
                
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us a bit about yourself..." 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Max 160 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <h3 className="text-lg font-medium mt-6 mb-4">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input placeholder="https://facebook.com/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="mt-4">Save Changes</Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || "User"} />
                  <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{userProfile?.displayName}</h2>
                <p className="text-muted-foreground">{userProfile?.email}</p>
              </div>

              {userProfile?.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Bio</h3>
                  <p className="text-muted-foreground">{userProfile.bio}</p>
                </div>
              )}

              {userProfile?.socialLinks && Object.values(userProfile.socialLinks).some(link => link) && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Social Links</h3>
                  <div className="flex flex-wrap gap-4">
                    {userProfile.socialLinks.facebook && (
                      <a href={userProfile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        Facebook
                      </a>
                    )}
                    
                    {userProfile.socialLinks.twitter && (
                      <a href={userProfile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        Twitter
                      </a>
                    )}
                    
                    {userProfile.socialLinks.linkedin && (
                      <a href={userProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        LinkedIn
                      </a>
                    )}
                    
                    {userProfile.socialLinks.instagram && (
                      <a href={userProfile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-muted/10 px-6 py-4">
          <p className="text-xs text-muted-foreground">Member since: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfilePage;
