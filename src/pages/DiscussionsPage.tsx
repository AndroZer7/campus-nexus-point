
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, deleteDoc, doc, updateDoc, where, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { MessageSquare, User, Plus, MessageCircle, Trash2, AlertTriangle, ThumbsUp } from 'lucide-react';

const forumSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
});

const commentSchema = z.object({
  content: z.string().min(1, { message: "Comment cannot be empty" }).max(500, { message: "Comment is too long" }),
});

type ForumPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  createdAt: Date;
  commentCount: number;
  likeCount: number;
};

type ForumComment = {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  createdAt: Date;
};

const DiscussionsPage = () => {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [comments, setComments] = useState<Record<string, ForumComment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof forumSchema>>({
    resolver: zodResolver(forumSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
    },
  });

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const postsCollection = collection(firestore, "forumPosts");
      let q;
      
      if (activeCategory !== "all") {
        q = query(
          postsCollection, 
          where("category", "==", activeCategory), 
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(postsCollection, orderBy("createdAt", "desc"));
      }
      
      const querySnapshot = await getDocs(q);
      
      const fetchedPosts: ForumPost[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedPosts.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          category: data.category,
          authorId: data.authorId,
          authorName: data.authorName,
          authorPhotoUrl: data.authorPhotoUrl,
          createdAt: data.createdAt.toDate(),
          commentCount: data.commentCount || 0,
          likeCount: data.likeCount || 0,
        });
      });
      
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load discussions. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const commentsCollection = collection(firestore, "forumComments");
      const q = query(
        commentsCollection, 
        where("postId", "==", postId), 
        orderBy("createdAt", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      
      const fetchedComments: ForumComment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedComments.push({
          id: doc.id,
          postId: data.postId,
          content: data.content,
          authorId: data.authorId,
          authorName: data.authorName,
          authorPhotoUrl: data.authorPhotoUrl,
          createdAt: data.createdAt.toDate(),
        });
      });
      
      setComments(prevComments => ({
        ...prevComments,
        [postId]: fetchedComments
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load comments. Please try again.",
      });
    }
  };

  const onSubmitPost = async (data: z.infer<typeof forumSchema>) => {
    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be signed in to create a post.",
      });
      return;
    }

    try {
      const postData = {
        ...data,
        authorId: userProfile.uid,
        authorName: userProfile.displayName || "Anonymous",
        authorPhotoUrl: userProfile.photoURL,
        createdAt: Timestamp.now(),
        commentCount: 0,
        likeCount: 0,
      };
      
      await addDoc(collection(firestore, "forumPosts"), postData);
      
      toast({
        title: "Post Created",
        description: "Your post has been successfully created.",
      });
      
      setOpenDialog(false);
      form.reset();
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create post. Please try again.",
      });
    }
  };

  const onSubmitComment = async (data: z.infer<typeof commentSchema>) => {
    if (!userProfile || !currentPostId) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be signed in to comment.",
      });
      return;
    }

    try {
      const commentData = {
        postId: currentPostId,
        content: data.content,
        authorId: userProfile.uid,
        authorName: userProfile.displayName || "Anonymous",
        authorPhotoUrl: userProfile.photoURL,
        createdAt: Timestamp.now(),
      };
      
      await addDoc(collection(firestore, "forumComments"), commentData);
      
      // Update comment count on the post
      const postRef = doc(firestore, "forumPosts", currentPostId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const currentCount = postDoc.data().commentCount || 0;
        await updateDoc(postRef, {
          commentCount: currentCount + 1
        });
      }
      
      toast({
        title: "Comment Added",
        description: "Your comment has been successfully added.",
      });
      
      setCommentDialogOpen(false);
      commentForm.reset();
      fetchComments(currentPostId);
      fetchPosts(); // Refresh post list to update comment count
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add comment. Please try again.",
      });
    }
  };

  const toggleExpandPost = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
  };

  const openCommentDialog = (postId: string) => {
    setCurrentPostId(postId);
    setCommentDialogOpen(true);
  };

  const likePost = async (postId: string) => {
    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be signed in to like posts.",
      });
      return;
    }

    try {
      // Check if user already liked this post
      const likesRef = collection(firestore, "postLikes");
      const q = query(
        likesRef,
        where("postId", "==", postId),
        where("userId", "==", userProfile.uid)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({
          title: "Already Liked",
          description: "You have already liked this post.",
        });
        return;
      }
      
      // Add like record
      await addDoc(likesRef, {
        postId,
        userId: userProfile.uid,
        createdAt: Timestamp.now()
      });
      
      // Update like count on post
      const postRef = doc(firestore, "forumPosts", postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const currentLikes = postDoc.data().likeCount || 0;
        await updateDoc(postRef, {
          likeCount: currentLikes + 1
        });
      }
      
      toast({
        title: "Post Liked",
        description: "You liked this post.",
      });
      
      fetchPosts(); // Refresh to update like count
    } catch (error) {
      console.error("Error liking post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to like post. Please try again.",
      });
    }
  };

  const deletePost = async (postId: string) => {
    if (!userProfile) return;
    
    try {
      // Delete the post
      await deleteDoc(doc(firestore, "forumPosts", postId));
      
      // Delete all comments for this post
      const commentsRef = collection(firestore, "forumComments");
      const q = query(commentsRef, where("postId", "==", postId));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(firestore, "forumComments", document.id));
      });
      
      toast({
        title: "Post Deleted",
        description: "The post and its comments have been successfully deleted.",
      });
      
      setPosts(posts.filter(post => post.id !== postId));
      const newComments = { ...comments };
      delete newComments[postId];
      setComments(newComments);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post. Please try again.",
      });
    }
  };

  const deleteComment = async (commentId: string, postId: string) => {
    if (!userProfile) return;
    
    try {
      await deleteDoc(doc(firestore, "forumComments", commentId));
      
      // Update comment count on post
      const postRef = doc(firestore, "forumPosts", postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const currentCount = postDoc.data().commentCount || 0;
        await updateDoc(postRef, {
          commentCount: Math.max(0, currentCount - 1)
        });
      }
      
      toast({
        title: "Comment Deleted",
        description: "The comment has been successfully deleted.",
      });
      
      // Update local state
      setComments(prevComments => ({
        ...prevComments,
        [postId]: prevComments[postId].filter(comment => comment.id !== commentId)
      }));
      fetchPosts(); // Refresh to update comment count
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete comment. Please try again.",
      });
    }
  };

  const reportPost = (postId: string) => {
    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be signed in to report posts.",
      });
      return;
    }

    toast({
      title: "Post Reported",
      description: "Thank you for reporting this post. Our moderators will review it.",
    });
  };

  const categories = [
    { id: "all", name: "All Topics" },
    { id: "general", name: "General Discussion" },
    { id: "academics", name: "Academics" },
    { id: "campus", name: "Campus Life" },
    { id: "events", name: "Events" },
    { id: "clubs", name: "Clubs & Organizations" },
    { id: "housing", name: "Housing" },
    { id: "careers", name: "Careers & Jobs" },
    { id: "help", name: "Help & Support" },
  ];

  const canModifyPost = (post: ForumPost) => {
    return userProfile && (userProfile.uid === post.authorId || userProfile.isAdmin);
  };

  const canModifyComment = (comment: ForumComment) => {
    return userProfile && (userProfile.uid === comment.authorId || userProfile.isAdmin);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + ' · ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discussions</h1>
          <p className="text-muted-foreground mt-2">Join the conversation with fellow students and faculty</p>
        </div>
        
        {userProfile && (
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <Plus className="mr-2 h-4 w-4" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>
                  Start a new discussion topic to share with the community.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPost)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Write a descriptive title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <select 
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...field}
                          >
                            <option value="">Select a category</option>
                            {categories.filter(cat => cat.id !== 'all').map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your thoughts or question..." 
                            rows={6}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit">Post Discussion</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card shadow rounded-lg p-4 sticky top-24">
            <h3 className="font-medium mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.authorPhotoUrl || undefined} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{post.title}</CardTitle>
                          <CardDescription className="flex flex-wrap gap-2 items-center">
                            <span>{post.authorName}</span>
                            <span className="text-xs">•</span>
                            <span>{formatDate(post.createdAt)}</span>
                            <span className="text-xs">•</span>
                            <span className="capitalize">{categories.find(c => c.id === post.category)?.name || post.category}</span>
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {canModifyPost(post) ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePost(post.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              reportPost(post.id);
                            }}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className={expandedPost === post.id ? "" : "line-clamp-3"}>
                      {post.content}
                    </div>
                    {post.content.length > 300 && (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto mt-1"
                        onClick={() => toggleExpandPost(post.id)}
                      >
                        {expandedPost === post.id ? "Read less" : "Read more"}
                      </Button>
                    )}
                  </CardContent>
                  
                  <CardFooter className="border-t bg-muted/10 px-6 py-3 justify-between">
                    <div className="flex gap-6">
                      <Button 
                        variant="ghost" 
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => likePost(post.id)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likeCount}</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleExpandPost(post.id)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.commentCount}</span>
                      </Button>
                    </div>
                    
                    {userProfile && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openCommentDialog(post.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                    )}
                  </CardFooter>
                  
                  {expandedPost === post.id && comments[post.id] && (
                    <div className="border-t px-6 py-4">
                      <h4 className="text-sm font-medium mb-4">Comments ({comments[post.id].length})</h4>
                      {comments[post.id].length > 0 ? (
                        <div className="space-y-4">
                          {comments[post.id].map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.authorPhotoUrl || undefined} />
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted p-3 rounded-lg">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium">{comment.authorName}</p>
                                      <p className="text-xs text-muted-foreground mb-2">
                                        {formatDate(comment.createdAt)}
                                      </p>
                                    </div>
                                    
                                    {canModifyComment(comment) && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-6 p-0"
                                        onClick={() => deleteComment(comment.id, post.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-card rounded-lg shadow">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium mt-4">No discussions found</h3>
              <p className="text-muted-foreground mt-1">
                {activeCategory === "all" 
                  ? "Be the first to start a discussion!" 
                  : `There are no discussions in this category yet.`}
              </p>
              {userProfile && (
                <Button onClick={() => setOpenDialog(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Start a Discussion
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Share your thoughts on this discussion.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...commentForm}>
            <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="space-y-4">
              <FormField
                control={commentForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your comment..." 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Keep it constructive and respectful.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Post Comment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscussionsPage;
