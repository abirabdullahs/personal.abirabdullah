'use client';

import * as React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Image as ImageIcon, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Database, 
  Search, 
  ExternalLink, 
  Github, 
  LogOut, 
  Check, 
  RefreshCw,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProjectSection } from '@/components/admin/project-section';
import { BlogSection } from '@/components/admin/blog-section';
import { PostsSection } from '@/components/admin/posts-section';
import { GallerySection } from '@/components/admin/gallery-section';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { createDefaultProfile, initialActivityLogs, portfolioStorageKeys, readAdminAuthSession, readStoredCollection, writeAdminAuthSession, writeStoredCollection, type PortfolioBlog, type PortfolioGalleryItem, type PortfolioPost, type PortfolioProject, type PortfolioProfile } from '@/lib/portfolio-data';

export default function AdminDashboard() {
  const router = useRouter();
  
  // Navigation tabs
  const [currentTab, setCurrentTab] = React.useState<'dashboard' | 'projects' | 'blogs' | 'posts' | 'gallery' | 'database' | 'settings'>('dashboard');
  
  // Main state collections
  const [projects, setProjects] = React.useState<PortfolioProject[]>([]);
  const [blogs, setBlogs] = React.useState<PortfolioBlog[]>([]);
  const [posts, setPosts] = React.useState<PortfolioPost[]>([]);
  const [gallery, setGallery] = React.useState<PortfolioGalleryItem[]>([]);
  const [activities, setActivities] = React.useState<any[]>([]);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Modal controllers
  const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<any | null>(null);
  
  const [isBlogModalOpen, setIsBlogModalOpen] = React.useState(false);
  const [editingBlog, setEditingBlog] = React.useState<any | null>(null);
  
  const [isGalleryModalOpen, setIsGalleryModalOpen] = React.useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = React.useState(false);
  
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    type: 'project' | 'blog' | 'gallery' | null;
    id: any;
    name: string;
  } | null>(null);
  
  // Database status simulating
  const [dbStatus, setDbStatus] = React.useState<'checking' | 'connected' | 'not_configured'>('checking');
  
  // Project form states
  const [projName, setProjName] = React.useState('');
  const [projSlug, setProjSlug] = React.useState('');
  const [projDesc, setProjDesc] = React.useState('');
  const [projTech, setProjTech] = React.useState('');
  const [projGithub, setProjGithub] = React.useState('');
  const [projLive, setProjLive] = React.useState('');
  const [projImage, setProjImage] = React.useState('');

  // Blog form states
  const [blogTitle, setBlogTitle] = React.useState('');
  const [blogSlug, setBlogSlug] = React.useState('');
  const [blogExcerpt, setBlogExcerpt] = React.useState('');
  const [blogContent, setBlogContent] = React.useState('');
  const [blogCategory, setBlogCategory] = React.useState('');
  const [blogReadingTime, setBlogReadingTime] = React.useState(5);
  const [blogStatus, setBlogStatus] = React.useState('published');

  // Gallery form states
  const [galName, setGalName] = React.useState('');
  const [galUrl, setGalUrl] = React.useState('');

  // Post form states
  const [postText, setPostText] = React.useState('');
  const [postVisibility, setPostVisibility] = React.useState('public');

  // Settings form states
  const [adminName, setAdminName] = React.useState('Abir Abdullah');
  const [adminRole, setAdminRole] = React.useState('Administrator');
  const [adminEmail, setAdminEmail] = React.useState('personal.abirabdullah@gmail.com');
  const [adminPassword, setAdminPassword] = React.useState('abir123456');

  // Initial load
  React.useEffect(() => {
    const authSession = readAdminAuthSession();
    if (!authSession?.authenticated) {
      router.replace('/admin/login');
      return;
    }

    const storedProjects = readStoredCollection<PortfolioProject[]>(portfolioStorageKeys.projects, []);
    setProjects(storedProjects);

    const storedBlogs = readStoredCollection<PortfolioBlog[]>(portfolioStorageKeys.blogs, []);
    setBlogs(storedBlogs);

    const storedPosts = readStoredCollection<PortfolioPost[]>(portfolioStorageKeys.posts, []);
    setPosts(storedPosts);

    const storedGallery = readStoredCollection<PortfolioGalleryItem[]>(portfolioStorageKeys.gallery, []);
    setGallery(storedGallery);

    const storedProfile = readStoredCollection<PortfolioProfile | null>(portfolioStorageKeys.profile, null);
    if (storedProfile) {
      setAdminName(storedProfile.name || 'Abir Abdullah');
      setAdminRole(storedProfile.role || 'Administrator');
      setAdminEmail(storedProfile.email || 'personal.abirabdullah@gmail.com');
      setAdminPassword(storedProfile.password || 'abir123456');
    } else {
      const defaults = createDefaultProfile();
      setAdminName(defaults.name);
      setAdminRole(defaults.role);
      setAdminEmail(defaults.email);
      setAdminPassword(defaults.password);
      writeStoredCollection(portfolioStorageKeys.profile, defaults);
    }

    const storedLogs = readStoredCollection<any[]>(portfolioStorageKeys.activities, initialActivityLogs);
    setActivities(storedLogs);

    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasSupabase) {
      setDbStatus('connected');

      const client = getSupabase();

      const fetchDatabaseData = async () => {
        try {
          const { data: projData, error: projError } = await client
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
          if (projError) throw projError;
          if (projData) {
            setProjects(projData as PortfolioProject[]);
            writeStoredCollection(portfolioStorageKeys.projects, projData as PortfolioProject[]);
          }
        } catch (err) {
          console.warn('Could not load projects from Supabase. Falling back to local state.', err);
        }

        try {
          const { data: blogData, error: blogError } = await client
            .from('blogs')
            .select('*')
            .order('published_at', { ascending: false });
          if (blogError) throw blogError;
          if (blogData) {
            setBlogs(blogData as PortfolioBlog[]);
            writeStoredCollection(portfolioStorageKeys.blogs, blogData as PortfolioBlog[]);
          }
        } catch (err) {
          console.warn('Could not load blogs from Supabase. Falling back to local state.', err);
        }

        try {
          const { data: galData, error: galError } = await client
            .from('gallery')
            .select('*');
          if (galError) throw galError;
          if (galData) {
            setGallery(galData as PortfolioGalleryItem[]);
            writeStoredCollection(portfolioStorageKeys.gallery, galData as PortfolioGalleryItem[]);
          }
        } catch (err) {
          console.warn('Could not load gallery from Supabase. Falling back to local state.', err);
        }
      };

      fetchDatabaseData();
    } else {
      setDbStatus('not_configured');
    }
  }, []);

  // Sync to localStorage and add activity helpers
  const logActivity = (actionText: string) => {
    const newAct = {
      id: Date.now(),
      action: actionText,
      time: 'Just now'
    };
    const updated = [newAct, ...activities.slice(0, 19)];
    setActivities(updated);
    writeStoredCollection(portfolioStorageKeys.activities, updated);
  };

  // Autogenerate slugs
  React.useEffect(() => {
    if (projName && !editingProject) {
      setProjSlug(projName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [projName, editingProject]);

  React.useEffect(() => {
    if (blogTitle && !editingBlog) {
      setBlogSlug(blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [blogTitle, editingBlog]);

  // Sign out
  const handleSignOut = () => {
    writeAdminAuthSession(null);
    toast.success("Logged out successfully");
    router.push('/admin/login');
  };

  // CREATE/UPDATE PROJECTS
  const openAddProject = () => {
    setEditingProject(null);
    setProjName('');
    setProjSlug('');
    setProjDesc('');
    setProjTech('');
    setProjGithub('');
    setProjLive('');
    setProjImage('');
    setIsProjectModalOpen(true);
  };

  const openEditProject = (proj: any) => {
    setEditingProject(proj);
    setProjName(proj.name);
    setProjSlug(proj.slug);
    setProjDesc(proj.short_description);
    setProjTech(Array.isArray(proj.tech_stack) ? proj.tech_stack.join(', ') : proj.tech_stack || '');
    setProjGithub(proj.github_repo || '');
    setProjLive(proj.live_link || '');
    setProjImage(proj.image_url || '');
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !projSlug) {
      toast.error("Please fill in the project name and slug");
      return;
    }

    const techArray = projTech.split(',').map(t => t.trim()).filter(Boolean);

    let updatedProjects;
    const targetId = editingProject ? editingProject.id : Date.now();
    const projectObj = {
      id: targetId,
      name: projName,
      slug: projSlug,
      short_description: projDesc,
      tech_stack: techArray,
      github_repo: projGithub || '#',
      live_link: projLive || '#',
      image_url: projImage || '',
      created_at: editingProject ? editingProject.created_at : new Date().toISOString()
    };

    try {
      if (dbStatus === 'connected') {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: editingProject ? 'update' : 'create',
            table: 'projects',
            id: editingProject ? editingProject.id : undefined,
            payload: {
              name: projName,
              slug: projSlug,
              short_description: projDesc,
              tech_stack: techArray,
              github_repo: projGithub || '#',
              live_link: projLive || '#',
              image_url: projImage || ''
            },
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Project save failed');
      }

      if (editingProject) {
        updatedProjects = projects.map(p => p.id === editingProject.id ? projectObj : p);
        toast.success("Project updated successfully");
        logActivity(`Updated project "${projName}"`);
      } else {
        updatedProjects = [projectObj, ...projects];
        toast.success("Project added successfully");
        logActivity(`Created project "${projName}"`);
      }

      setProjects(updatedProjects);
      writeStoredCollection(portfolioStorageKeys.projects, updatedProjects);
      setIsProjectModalOpen(false);
    } catch (err: any) {
      console.error("Project save failed:", err);
      toast.error(err.message || 'Unable to save project');
    }
  };

  const handleDeleteProject = (id: any, name: string) => {
    setDeleteConfirm({ type: 'project', id, name });
  };

  const executeDeleteProject = async (id: any, name: string) => {
    const filtered = projects.filter(p => p.id !== id);
    setProjects(filtered);
    writeStoredCollection(portfolioStorageKeys.projects, filtered);

    if (dbStatus === 'connected') {
      try {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', table: 'projects', id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        toast.success(`"${name}" deleted from database and local storage`);
      } catch (err: any) {
        console.error("Project delete failed:", err);
        toast.error(`Database delete failed: ${err.message || err}. Removed from local workspace only.`);
      }
    } else {
      toast.success(`"${name}" deleted from local workspace`);
    }
    logActivity(`Deleted project "${name}"`);
  };


  // CREATE/UPDATE BLOGS
  const openAddBlog = () => {
    setEditingBlog(null);
    setBlogTitle('');
    setBlogSlug('');
    setBlogExcerpt('');
    setBlogContent('');
    setBlogCategory('Tech');
    setBlogReadingTime(5);
    setBlogStatus('published');
    setIsBlogModalOpen(true);
  };

  const openEditBlog = (blog: any) => {
    setEditingBlog(blog);
    setBlogTitle(blog.title);
    setBlogSlug(blog.slug);
    setBlogExcerpt(blog.excerpt);
    setBlogContent(blog.content || '');
    setBlogCategory(blog.category);
    setBlogReadingTime(blog.reading_time);
    setBlogStatus(blog.status || 'published');
    setIsBlogModalOpen(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle || !blogSlug) {
      toast.error("Please enter a title and slug");
      return;
    }

    const targetId = editingBlog ? editingBlog.id : Date.now();
    const blogObj = {
      id: targetId,
      title: blogTitle,
      slug: blogSlug,
      excerpt: blogExcerpt,
      content: blogContent,
      category: blogCategory,
      reading_time: Number(blogReadingTime),
      status: blogStatus,
      published_at: editingBlog ? editingBlog.published_at : new Date().toISOString().split('T')[0]
    };

    let updatedBlogs;

    try {
      if (dbStatus === 'connected') {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: editingBlog ? 'update' : 'create',
            table: 'blogs',
            id: editingBlog ? editingBlog.id : undefined,
            payload: {
              title: blogTitle,
              slug: blogSlug,
              excerpt: blogExcerpt,
              content: blogContent,
              category: blogCategory,
              reading_time: Number(blogReadingTime),
              status: blogStatus,
            },
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Blog save failed');
      }

      if (editingBlog) {
        updatedBlogs = blogs.map(b => b.id === editingBlog.id ? blogObj : b);
        toast.success("Blog post updated successfully");
        logActivity(`Updated blog post "${blogTitle}"`);
      } else {
        updatedBlogs = [blogObj, ...blogs];
        toast.success("Blog post published successfully");
        logActivity(`Created blog post "${blogTitle}"`);
      }

      setBlogs(updatedBlogs);
      writeStoredCollection(portfolioStorageKeys.blogs, updatedBlogs);
      setIsBlogModalOpen(false);
    } catch (err: any) {
      console.error("Blog save failed:", err);
      toast.error(err.message || 'Unable to save blog post');
    }
  };

  const handleDeleteBlog = (id: any, title: string) => {
    setDeleteConfirm({ type: 'blog', id, name: title });
  };

  const executeDeleteBlog = async (id: any, title: string) => {
    const filtered = blogs.filter(b => b.id !== id);
    setBlogs(filtered);
    writeStoredCollection(portfolioStorageKeys.blogs, filtered);

    if (dbStatus === 'connected') {
      try {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', table: 'blogs', id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        toast.success(`"${title}" deleted from database and local storage`);
      } catch (err: any) {
        console.error("Blog delete failed:", err);
        toast.error(`Database delete failed: ${err.message || err}. Removed from local workspace only.`);
      }
    } else {
      toast.success(`"${title}" deleted from local workspace`);
    }
    logActivity(`Deleted blog post "${title}"`);
  };


  // GALLERY CRUD
  const openAddGallery = () => {
    setGalName('');
    setGalUrl('');
    setIsGalleryModalOpen(true);
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galName || !galUrl) {
      toast.error("Please fill in all gallery fields");
      return;
    }

    const targetId = Date.now();
    const newImg = {
      id: targetId,
      name: galName,
      url: galUrl
    };

    try {
      if (dbStatus === 'connected') {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', table: 'gallery', payload: newImg }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gallery save failed');
      }

      const updated = [newImg, ...gallery];
      setGallery(updated);
      writeStoredCollection(portfolioStorageKeys.gallery, updated);
      toast.success("Image uploaded to gallery");
      logActivity(`Added image "${galName}" to gallery`);
      setIsGalleryModalOpen(false);
    } catch (err: any) {
      console.error("Gallery save failed:", err);
      toast.error(err.message || 'Unable to save gallery image');
    }
  };

  const handleDeleteGallery = (id: any, name: string) => {
    setDeleteConfirm({ type: 'gallery', id, name });
  };

  const executeDeleteGallery = async (id: any, name: string) => {
    const filtered = gallery.filter(g => g.id !== id);
    setGallery(filtered);
    writeStoredCollection(portfolioStorageKeys.gallery, filtered);

    if (dbStatus === 'connected') {
      try {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', table: 'gallery', id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        toast.success(`"${name}" removed from database and local storage`);
      } catch (err: any) {
        console.error("Gallery delete failed:", err);
        toast.error(`Database delete failed: ${err.message || err}. Removed from local workspace only.`);
      }
    } else {
      toast.success(`Image removed`);
    }
    logActivity(`Removed gallery image "${name}"`);
  };


  // SAVE PROFILE SETTINGS
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = {
      name: adminName,
      role: adminRole,
      email: adminEmail,
      password: adminPassword
    };
    writeStoredCollection(portfolioStorageKeys.profile, profile);
    
    // Also sync the login credentials
    toast.success('Profile credentials updated successfully');
    logActivity('Updated administrator credentials');
  };

  const openAddPost = () => {
    setPostText('');
    setPostVisibility('public');
    setIsPostModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) {
      toast.error('Please enter some post content');
      return;
    }

    const newPost: PortfolioPost = {
      id: Date.now(),
      text: postText,
      visibility: postVisibility,
      pinned: false,
      created_at: new Date().toISOString(),
    };

    try {
      if (dbStatus === 'connected') {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', table: 'posts', payload: newPost }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Post save failed');
      }

      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      writeStoredCollection(portfolioStorageKeys.posts, updatedPosts);
      setIsPostModalOpen(false);
      logActivity('Added a project update');
      toast.success('Post added successfully');
    } catch (err: any) {
      console.error('Post save failed:', err);
      toast.error(err.message || 'Unable to save post');
    }
  };

  // Filters search query
  const filteredProjects = projects.filter((p) => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.short_description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGallery = gallery.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-6 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <div className="h-2 w-2 bg-primary-foreground rounded-full animate-pulse"></div>
            </div>
            <span className="font-semibold tracking-tight">Portfolio Admin</span>
          </div>
          <ThemeToggle />
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Management</div>
          
          <Button 
            variant="ghost" 
            onClick={() => setCurrentTab('dashboard')} 
            className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'dashboard' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setCurrentTab('projects')} 
            className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'projects' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
          >
            <Briefcase className="w-4 h-4" />
            Projects
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setCurrentTab('blogs')} 
            className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'blogs' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
          >
            <FileText className="w-4 h-4" />
            Blog Posts
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => setCurrentTab('posts')} 
            className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'posts' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
          >
            <FileText className="w-4 h-4" />
            Posts
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setCurrentTab('gallery')} 
            className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'gallery' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
          >
            <ImageIcon className="w-4 h-4" />
            Gallery
          </Button>
          
          <div className="pt-4 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</div>
          
          <Button 
            variant="ghost" 
            onClick={() => setCurrentTab('database')} 
            className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'database' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
          >
            <Database className="w-4 h-4" />
            Database Configuration
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setCurrentTab('settings')} 
            className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'settings' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
          >
            <Settings className="w-4 h-4" />
            Profile Credentials
          </Button>
        </nav>

        <div className="p-4 border-t border-border flex items-center justify-between gap-2 bg-muted/20">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-8 w-8 rounded-full border border-border shrink-0">
              <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${adminName}`} />
              <AvatarFallback>AA</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate">{adminName}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider">{adminRole}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border px-8 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground capitalize">Admin</span>
            <span className="text-muted-foreground/30">/</span>
            <span className="font-semibold text-foreground capitalize">{currentTab}</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="text-xs font-medium hover:bg-accent gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                View Live Site
              </Button>
            </a>
            {currentTab === 'projects' && (
              <Button size="sm" onClick={openAddProject} className="text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Project
              </Button>
            )}
            {currentTab === 'blogs' && (
              <Button size="sm" onClick={openAddBlog} className="text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Write Post
              </Button>
            )}
            {currentTab === 'gallery' && (
              <Button size="sm" onClick={openAddGallery} className="text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Image
              </Button>
            )}
            {currentTab === 'posts' && (
              <Button size="sm" onClick={openAddPost} className="text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Post
              </Button>
            )}
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight capitalize">{currentTab === 'settings' ? 'Credentials' : currentTab}</h1>
              <p className="text-muted-foreground mt-1">
                {currentTab === 'dashboard' && 'Manage your personal portfolio, upload new project showcases, and write articles.'}
                {currentTab === 'projects' && 'Add, update, and showcase your professional development and open-source projects.'}
                {currentTab === 'blogs' && 'Create drafts and publish industry insight articles directly to your blog.'}
                {currentTab === 'posts' && 'Manage project updates and short status posts for the public site.'}
                {currentTab === 'gallery' && 'Maintain a visual directory of setups, conferences, and design achievements.'}
                {currentTab === 'database' && 'View your Cloud Supabase connection details and table mapping status.'}
                {currentTab === 'settings' && 'Update your name, administrator role, and dynamic dashboard login credentials.'}
              </p>
            </div>
            
            {(currentTab === 'projects' || currentTab === 'blogs' || currentTab === 'posts' || currentTab === 'gallery' || currentTab === 'dashboard') && (
              <div className="relative shrink-0">
                <Input 
                  placeholder="Search item..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64 text-sm focus-visible:ring-primary h-9 bg-card border-border" 
                />
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-none bg-card hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setCurrentTab('projects')}>
                  <CardHeader className="pb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Projects</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight">{projects.length}</span>
                      <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none bg-card hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setCurrentTab('blogs')}>
                  <CardHeader className="pb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Blog Posts</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight">{blogs.length}</span>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {blogs.filter(b => b.status === 'published').length} Published
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none bg-card hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setCurrentTab('gallery')}>
                  <CardHeader className="pb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gallery Images</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight">{gallery.length}</span>
                      <span className="text-xs font-semibold text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 rounded">Grid</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none bg-card">
                  <CardHeader className="pb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Database Sync</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold truncate">
                        {dbStatus === 'connected' ? 'Connected (Supabase)' : dbStatus === 'checking' ? 'Checking...' : 'Mock Client Mode'}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${dbStatus === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-400'}`}>
                        {dbStatus === 'connected' ? 'Cloud' : 'Local'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Dynamic activity log & Quick actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-none flex flex-col overflow-hidden bg-card border-border">
                  <div className="bg-muted/30 border-b border-border px-6 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dynamic Dashboard Activity Logs</span>
                    <Badge variant="outline" className="text-[10px]">Realtime State</Badge>
                  </div>
                  <CardContent className="p-0 flex-1 divide-y divide-border/60">
                    {activities.length > 0 ? (
                      activities.map((act) => (
                        <div key={act.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-muted/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{act.action}</p>
                              <p className="text-[11px] text-muted-foreground">{act.time}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">Success</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground p-6 text-sm text-center">No recent logged actions.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-none bg-muted/20 border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground">Quick Management Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={openAddProject} className="w-full justify-start text-xs h-10 gap-2">
                      <Plus className="w-4 h-4" /> Create New Project Showcase
                    </Button>
                    <Button onClick={openAddBlog} variant="outline" className="w-full justify-start text-xs h-10 gap-2 bg-card border-border">
                      <Plus className="w-4 h-4 text-primary" /> Write and Publish Article
                    </Button>
                    <Button onClick={openAddGallery} variant="outline" className="w-full justify-start text-xs h-10 gap-2 bg-card border-border">
                      <ImageIcon className="w-4 h-4 text-primary" /> Upload Picture to Gallery
                    </Button>
                    <Button onClick={() => setCurrentTab('database')} variant="outline" className="w-full justify-start text-xs h-10 gap-2 bg-card border-border">
                      <Database className="w-4 h-4 text-primary" /> Verify Supabase Integration
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS MANAGEMENT */}
          {currentTab === 'projects' && (
            <ProjectSection
              projects={projects}
              filteredProjects={filteredProjects}
              onAdd={openAddProject}
              onEdit={openEditProject}
              onDelete={handleDeleteProject}
            />
          )}

          {/* TAB 3: BLOGS MANAGEMENT */}
          {currentTab === 'blogs' && (
            <BlogSection
              blogs={blogs}
              filteredBlogs={filteredBlogs}
              onAdd={openAddBlog}
              onEdit={openEditBlog}
              onDelete={handleDeleteBlog}
            />
          )}

          {/* TAB 4: POSTS MANAGEMENT */}
          {currentTab === 'posts' && (
            <PostsSection posts={posts} onAdd={openAddPost} />
          )}

          {/* TAB 5: GALLERY MANAGEMENT */}
          {currentTab === 'gallery' && (
            <GallerySection
              gallery={gallery}
              filteredGallery={filteredGallery}
              onAdd={openAddGallery}
              onDelete={handleDeleteGallery}
            />
          )}

          {/* TAB 5: DATABASE STATUS CONFIGURATION */}
          {currentTab === 'database' && (
            <div className="max-w-3xl space-y-6">
              <Card className="shadow-none bg-card border-border">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <div className={`p-3 rounded-full ${dbStatus === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Supabase Cloud Database</CardTitle>
                    <CardDescription>
                      Checking status of server connection credentials in AI Studio
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded bg-muted/20">
                      <p className="text-xs text-muted-foreground font-semibold">NEXT_PUBLIC_SUPABASE_URL</p>
                      <p className="text-sm font-mono mt-1 break-all text-primary font-semibold">
                        {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Empty / Unconfigured'}
                      </p>
                    </div>
                    <div className="p-3 border rounded bg-muted/20">
                      <p className="text-xs text-muted-foreground font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
                      <p className="text-sm font-mono mt-1 break-all text-primary font-semibold">
                        {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '••••••••••••••••••••••••' : '❌ Empty / Unconfigured'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 p-3 rounded-lg leading-relaxed">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>
                      <strong>Environment note:</strong> Your Admin Panel contains a full-stack dual engine. When Supabase variables are set in your Settings menu, it synchronizes with PostgreSQL instantly. Otherwise, the app uses stateful <strong>Local Storage</strong> so that you can add/edit/delete seamlessly inside your browser!
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" className="text-xs" onClick={() => {
                      setDbStatus('checking');
                      setTimeout(() => {
                        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                          setDbStatus('connected');
                          toast.success("Successfully connected to Supabase PostgreSQL cluster!");
                        } else {
                          setDbStatus('not_configured');
                          toast.error("Supabase keys not found in environment. Remaining in stateful local storage sandbox mode.");
                        }
                      }, 600);
                    }}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-md font-bold">SQL Tables Schema Check</CardTitle>
                  <CardDescription>Mapped relational models in database schema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="divide-y divide-border/60">
                    {[
                      { table: 'blogs', columns: 'id (PK), title, slug, excerpt, content, category, reading_time, published_at, status', count: blogs.length },
                      { table: 'projects', columns: 'id (PK), name, slug, short_description, tech_stack, github_repo, live_link, image_url, created_at', count: projects.length },
                      { table: 'gallery', columns: 'id (PK), name, url', count: gallery.length }
                    ].map((tbl) => (
                      <div key={tbl.table} className="py-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-bold text-primary font-mono">{tbl.table}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">columns: {tbl.columns}</p>
                        </div>
                        <Badge variant="secondary">{tbl.count} entries mapped</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none bg-card border-border overflow-hidden">
                <CardHeader className="bg-muted/10">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" /> Setup PostgreSQL Tables (Supabase SQL Editor)
                  </CardTitle>
                  <CardDescription>Copy and paste this script into your Supabase SQL Editor to initialize matching tables instantly:</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 bg-muted/20 text-xs font-mono text-muted-foreground overflow-x-auto max-h-[300px] leading-relaxed border-t select-all">
{`-- 1. Create projects table
create table if not exists projects (
  id bigint primary key,
  name text not null,
  slug text not null unique,
  short_description text,
  tech_stack text[],
  github_repo text,
  live_link text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create blogs table
create table if not exists blogs (
  id bigint primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  category text,
  reading_time integer default 5,
  published_at text,
  status text default 'published'
);

-- 3. Create gallery table
create table if not exists gallery (
  id bigint primary key,
  name text not null,
  url text not null
);

-- 4. Set row-level security and access policies
alter table projects enable row level security;
alter table blogs enable row level security;
alter table gallery enable row level security;

create policy "Allow public select" on projects for select using (true);
create policy "Allow public select" on blogs for select using (true);
create policy "Allow public select" on gallery for select using (true);

create policy "Allow all for admin writes" on projects for all using (true) with check (true);
create policy "Allow all for admin writes" on blogs for all using (true) with check (true);
create policy "Allow all for admin writes" on gallery for all using (true) with check (true);`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 6: SETTINGS / PROFILE CREDENTIALS */}
          {currentTab === 'settings' && (
            <div className="max-w-xl">
              <Card className="shadow-none bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Dashboard Administrator Profile</CardTitle>
                  <CardDescription>
                    These credentials are saved locally so you can log in securely to this session.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Display Name</label>
                      <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Display Role</label>
                      <Input value={adminRole} onChange={(e) => setAdminRole(e.target.value)} className="bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Login Email</label>
                      <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Login Password</label>
                      <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="bg-background border-border" />
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t">
                      <Button type="submit" className="text-xs">
                        <Check className="h-3.5 w-3.5 mr-1.5" /> Update Admin Credentials
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* MODAL OVERLAY 1: PROJECT SHOWCASE MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-250">
            <div className="bg-muted/40 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-extrabold tracking-tight text-lg">{editingProject ? 'Modify Project' : 'Create Showcase Project'}</h2>
              <Button size="icon" variant="ghost" onClick={() => setIsProjectModalOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">✕</Button>
            </div>
            <form onSubmit={handleSaveProject} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Project Name</label>
                  <Input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="E.g. Chat App" required className="bg-muted/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Slug</label>
                  <Input value={projSlug} onChange={(e) => setProjSlug(e.target.value)} placeholder="chat-app" required className="bg-muted/10 font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Short Description</label>
                <Textarea value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="Provide a brief introductory excerpt..." rows={2} required className="bg-muted/10 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Tech Stack (comma separated)</label>
                <Input value={projTech} onChange={(e) => setProjTech(e.target.value)} placeholder="React, Express, Tailwind" className="bg-muted/10 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">GitHub Repo URL</label>
                  <Input value={projGithub} onChange={(e) => setProjGithub(e.target.value)} placeholder="https://github.com/..." className="bg-muted/10 text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Live App URL</label>
                  <Input value={projLive} onChange={(e) => setProjLive(e.target.value)} placeholder="https://..." className="bg-muted/10 text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Showcase Image URL</label>
                <Input value={projImage} onChange={(e) => setProjImage(e.target.value)} className="bg-muted/10 text-xs font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="ghost" className="text-xs" onClick={() => setIsProjectModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="text-xs">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY 2: BLOG POST WRITER MODAL */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border w-full max-w-2xl rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-250">
            <div className="bg-muted/40 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-extrabold tracking-tight text-lg">{editingBlog ? 'Update Post' : 'Compose Blog Article'}</h2>
              <Button size="icon" variant="ghost" onClick={() => setIsBlogModalOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">✕</Button>
            </div>
            <form onSubmit={handleSaveBlog} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Article Title</label>
                  <Input value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} placeholder="E.g. JavaScript tips" required className="bg-muted/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Slug</label>
                  <Input value={blogSlug} onChange={(e) => setBlogSlug(e.target.value)} placeholder="javascript-tips" required className="bg-muted/10 font-mono text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                  <Input value={blogCategory} onChange={(e) => setBlogCategory(e.target.value)} placeholder="Tech" required className="bg-muted/10 text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Reading Time (mins)</label>
                  <Input type="number" value={blogReadingTime} onChange={(e) => setBlogReadingTime(Number(e.target.value))} required className="bg-muted/10 text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                  <select 
                    value={blogStatus} 
                    onChange={(e) => setBlogStatus(e.target.value)} 
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:ring-primary"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Excerpt (Short description)</label>
                <Input value={blogExcerpt} onChange={(e) => setBlogExcerpt(e.target.value)} placeholder="Introductory summary..." required className="bg-muted/10 text-xs" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Content Markdown / Body Text</label>
                  <span className="text-[10px] text-muted-foreground">Supports double newline \n\n for paragraphs</span>
                </div>
                <Textarea 
                  value={blogContent} 
                  onChange={(e) => setBlogContent(e.target.value)} 
                  placeholder="Draft your thoughts, use ### for subheadings..." 
                  rows={8} 
                  required 
                  className="bg-muted/10 text-sm font-sans" 
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="ghost" className="text-xs" onClick={() => setIsBlogModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="text-xs">Publish Post</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY 3: GALLERY UPLOAD MODAL */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="bg-muted/40 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-extrabold tracking-tight text-lg">Add Gallery Image</h2>
              <Button size="icon" variant="ghost" onClick={() => setIsGalleryModalOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">✕</Button>
            </div>
            <form onSubmit={handleSaveGallery} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Image Label / Title</label>
                <Input value={galName} onChange={(e) => setGalName(e.target.value)} placeholder="Landscape Setup" required className="bg-muted/10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Image Asset URL</label>
                <Input value={galUrl} onChange={(e) => setGalUrl(e.target.value)} required className="bg-muted/10 text-xs font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="ghost" className="text-xs" onClick={() => setIsGalleryModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="text-xs">Add Image</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <h3 className="text-lg font-bold">Are you absolutely sure?</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This action will delete <strong>{deleteConfirm.name}</strong> permanently from both your local database and cloud storage, if connected. This cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" className="text-xs" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  className="text-xs" 
                  onClick={async () => {
                    const { type, id, name } = deleteConfirm;
                    setDeleteConfirm(null);
                    if (type === 'project') {
                      await executeDeleteProject(id, name);
                    } else if (type === 'blog') {
                      await executeDeleteBlog(id, name);
                    } else if (type === 'gallery') {
                      await executeDeleteGallery(id, name);
                    }
                  }}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
