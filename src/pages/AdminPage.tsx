
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Users, MessageSquare, CalendarCheck, Search, FileText, AlertTriangle, CheckCircle, XCircle, User } from 'lucide-react';
import { collection, getDocs, query, orderBy, where, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

// Types
type ReportedContent = {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'event' | 'lostFound';
  reason: string;
  reportedBy: string;
  reportedAt: Date;
  status: 'pending' | 'reviewed' | 'dismissed';
  contentSnapshot: any;
};

type UserData = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  isAdmin: boolean;
  isFaculty: boolean;
  createdAt: string;
  status: 'active' | 'banned' | 'warned';
};

const AdminPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [reportedContent, setReportedContent] = useState<ReportedContent[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalEvents: 0,
    totalLostFound: 0,
    reportedContentCount: 0
  });

  // Fetch admin data
  useEffect(() => {
    if (!userProfile) {
      navigate('/');
      return;
    }

    if (!userProfile.isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
      });
      navigate('/');
      return;
    }

    fetchData();
  }, [userProfile, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchReportedContent(),
        fetchDashboardStats()
      ]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load admin data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    const usersCollection = collection(firestore, "users");
    const q = query(usersCollection, orderBy("displayName"));
    const querySnapshot = await getDocs(q);
    
    const fetchedUsers: UserData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      fetchedUsers.push({
        uid: doc.id,
        displayName: data.displayName || "Anonymous",
        email: data.email || "",
        photoURL: data.photoURL || null,
        isAdmin: data.isAdmin || false,
        isFaculty: data.isFaculty || false,
        createdAt: data.createdAt || "",
        status: data.status || "active"
      });
    });
    
    setUsers(fetchedUsers);
  };

  const fetchReportedContent = async () => {
    // In a real application, we would fetch actual reported content from Firestore
    // This is just a placeholder that simulates fetching reported content
    const mockReportedContent: ReportedContent[] = [
      {
        id: "report1",
        contentId: "post1",
        contentType: "post",
        reason: "Inappropriate language",
        reportedBy: "User A",
        reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        status: "pending",
        contentSnapshot: {
          title: "Problematic Post Title",
          content: "This post contains potentially inappropriate language that needs review."
        }
      },
      {
        id: "report2",
        contentId: "comment1",
        contentType: "comment",
        reason: "Harassment",
        reportedBy: "User B",
        reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        status: "pending",
        contentSnapshot: {
          content: "This comment contains potentially harassing content that needs review."
        }
      }
    ];
    
    setReportedContent(mockReportedContent);
  };

  const fetchDashboardStats = async () => {
    const userCount = (await getDocs(collection(firestore, "users"))).size;
    const postCount = (await getDocs(collection(firestore, "forumPosts"))).size;
    const eventCount = (await getDocs(collection(firestore, "events"))).size;
    const lostFoundCount = (await getDocs(collection(firestore, "lostFound"))).size;
    
    setDashboardStats({
      totalUsers: userCount,
      totalPosts: postCount,
      totalEvents: eventCount,
      totalLostFound: lostFoundCount,
      reportedContentCount: 2 // Hardcoded for this example
    });
  };

  const toggleUserRole = async (uid: string, role: 'admin' | 'faculty', currentValue: boolean) => {
    try {
      const userRef = doc(firestore, "users", uid);
      await updateDoc(userRef, {
        [role === 'admin' ? 'isAdmin' : 'isFaculty']: !currentValue
      });
      
      toast({
        title: `Role Updated`,
        description: `User ${role} status has been ${!currentValue ? 'granted' : 'revoked'}.`,
      });
      
      // Update the local state
      setUsers(users.map(user => {
        if (user.uid === uid) {
          return {
            ...user,
            [role === 'admin' ? 'isAdmin' : 'isFaculty']: !currentValue
          };
        }
        return user;
      }));
    } catch (error) {
      console.error(`Error updating user ${role} status:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update user ${role} status.`,
      });
    }
  };

  const updateUserStatus = async (uid: string, status: 'active' | 'banned' | 'warned') => {
    try {
      const userRef = doc(firestore, "users", uid);
      await updateDoc(userRef, { status });
      
      toast({
        title: `User Status Updated`,
        description: `User status has been changed to ${status}.`,
      });
      
      // Update the local state
      setUsers(users.map(user => {
        if (user.uid === uid) {
          return { ...user, status };
        }
        return user;
      }));
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status.",
      });
    }
  };

  const handleContentReport = async (reportId: string, action: 'approve' | 'dismiss') => {
    try {
      // In a real application, we would update the report in Firestore
      // and potentially delete or flag the reported content
      
      // Update local state
      setReportedContent(reportedContent.map(report => {
        if (report.id === reportId) {
          return {
            ...report,
            status: action === 'approve' ? 'reviewed' : 'dismissed'
          };
        }
        return report;
      }));
      
      toast({
        title: `Report ${action === 'approve' ? 'Accepted' : 'Dismissed'}`,
        description: `The reported content has been ${action === 'approve' ? 'removed' : 'kept'}.`,
      });
    } catch (error) {
      console.error("Error handling content report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process content report.",
      });
    }
  };

  // If not admin, don't show this page
  if (!userProfile?.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Shield className="mr-2 h-6 w-6" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Manage users, content, and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardStats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Forum Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardStats.totalPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardStats.totalEvents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Lost & Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardStats.totalLostFound}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="reported" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Reported Content
            {reportedContent.filter(r => r.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-red-500">{reportedContent.filter(r => r.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : users.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left">User</th>
                          <th className="px-4 py-3 text-left">Email</th>
                          <th className="px-4 py-3 text-center">Admin</th>
                          <th className="px-4 py-3 text-center">Faculty</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.uid} className="border-t hover:bg-muted/20">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.photoURL || undefined} />
                                  <AvatarFallback>
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <span>{user.displayName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                            <td className="px-4 py-3 text-center">
                              <Switch 
                                checked={user.isAdmin} 
                                onCheckedChange={() => toggleUserRole(user.uid, 'admin', user.isAdmin)}
                                disabled={user.uid === userProfile?.uid} // Can't change own admin status
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Switch 
                                checked={user.isFaculty} 
                                onCheckedChange={() => toggleUserRole(user.uid, 'faculty', user.isFaculty)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <Badge variant={user.status === 'active' ? 'outline' : (user.status === 'banned' ? 'destructive' : 'secondary')}>
                                  {user.status}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                {user.uid !== userProfile?.uid && ( // Can't take action on yourself
                                  <>
                                    {user.status !== 'warned' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => updateUserStatus(user.uid, 'warned')}
                                      >
                                        Warn
                                      </Button>
                                    )}
                                    
                                    {user.status !== 'banned' ? (
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => updateUserStatus(user.uid, 'banned')}
                                      >
                                        Ban
                                      </Button>
                                    ) : (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => updateUserStatus(user.uid, 'active')}
                                      >
                                        Unban
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium mt-4">No users found</h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reported" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reported Content</CardTitle>
              <CardDescription>
                Review and moderate user-reported content across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : reportedContent.length > 0 ? (
                <div className="space-y-4">
                  {reportedContent.map((report) => (
                    <Card key={report.id} className={report.status !== 'pending' ? 'opacity-60' : ''}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">
                              Report: {report.contentType === 'post' ? 'Forum Post' : 
                                       report.contentType === 'comment' ? 'Comment' :
                                       report.contentType === 'event' ? 'Event' : 'Lost & Found Item'}
                            </CardTitle>
                            <CardDescription>
                              Reported {report.reportedAt.toLocaleDateString()} by {report.reportedBy}
                            </CardDescription>
                          </div>
                          <Badge variant={report.status === 'pending' ? 'outline' : 
                                          report.status === 'reviewed' ? 'destructive' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1">Reason for report:</h4>
                          <p className="text-muted-foreground">{report.reason}</p>
                        </div>
                        
                        <div className="bg-muted p-4 rounded-md">
                          <h4 className="text-sm font-medium mb-1">Content:</h4>
                          {report.contentType === 'post' && (
                            <>
                              <h5 className="font-medium">{report.contentSnapshot.title}</h5>
                              <p className="mt-1">{report.contentSnapshot.content}</p>
                            </>
                          )}
                          {report.contentType === 'comment' && (
                            <p>{report.contentSnapshot.content}</p>
                          )}
                        </div>
                      </CardContent>
                      {report.status === 'pending' && (
                        <CardFooter className="flex justify-end gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => handleContentReport(report.id, 'dismiss')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Dismiss
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleContentReport(report.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Remove Content
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium mt-4">No reported content</h3>
                  <p className="text-muted-foreground mt-1">There are no content reports to review at this time.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
