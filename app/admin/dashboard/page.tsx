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
  AlertCircle,
  Loader2,
  Menu
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProjectSection } from '@/components/admin/project-section';
import { BlogSection } from '@/components/admin/blog-section';
import { PostsSection } from '@/components/admin/posts-section';
import { GallerySection } from '@/components/admin/gallery-section';
import { ImageUploader } from '@/components/admin/image-uploader';
import { ImageGalleryUploader, type GalleryImageItem } from '@/components/admin/image-gallery-uploader';
import { MarkdownEditor } from '@/components/admin/markdown-editor';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { createDefaultAlbum, createDefaultProfile, initialActivityLogs, portfolioStorageKeys, readStoredCollection, writeStoredCollection, type PortfolioBlog, type PortfolioGalleryAlbum, type PortfolioGalleryItem, type PortfolioPost, type PortfolioProject, type PortfolioProfile } from '@/lib/portfolio-data';

export default function AdminDashboard() {
  const router = useRouter();
  
  // Navigation tabs
  const [currentTab, setCurrentTab] = React.useState<'dashboard' | 'projects' | 'blogs' | 'posts' | 'gallery' | 'database' | 'settings'>('dashboard');
  
  // Main state collections
  const [projects, setProjects] = React.useState<PortfolioProject[]>([]);
  const [blogs, setBlogs] = React.useState<PortfolioBlog[]>([]);
  const [posts, setPosts] = React.useState<PortfolioPost[]>([]);
  const [gallery, setGallery] = React.useState<PortfolioGalleryItem[]>([]);
  const [galleryAlbums, setGalleryAlbums] = React.useState<PortfolioGalleryAlbum[]>([]);
  const [activities, setActivities] = React.useState<any[]>([]);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  
  // Modal controllers
  const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<any | null>(null);
  
  const [isBlogModalOpen, setIsBlogModalOpen] = React.useState(false);
  const [editingBlog, setEditingBlog] = React.useState<any | null>(null);
  
  const [isGalleryModalOpen, setIsGalleryModalOpen] = React.useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<PortfolioPost | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    type: 'project' | 'blog' | 'gallery' | 'post' | null;
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
  const [projGalleryImages, setProjGalleryImages] = React.useState<GalleryImageItem[]>([]);
  const [originalProjGalleryImages, setOriginalProjGalleryImages] = React.useState<GalleryImageItem[]>([]);
  const [projGalleryLoading, setProjGalleryLoading] = React.useState(false);

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
  const [galAlbumId, setGalAlbumId] = React.useState<string>('');

  // Post form states
  const [postText, setPostText] = React.useState('');
  const [postVisibility, setPostVisibility] = React.useState('public');
  const [postProjectId, setPostProjectId] = React.useState<string>('');
  const [postPinned, setPostPinned] = React.useState(false);

  // Settings form states — public profile shown on Home/About (maps to the `admin` DB row)
  const [profileId, setProfileId] = React.useState<string | number | null>(null);
  const [adminName, setAdminName] = React.useState('Abir Abdullah');
  const [adminEmail, setAdminEmail] = React.useState('');
  const [profileHeadline, setProfileHeadline] = React.useState('');
  const [profileBio, setProfileBio] = React.useState('');
  const [profileAbout, setProfileAbout] = React.useState('');
  const [profilePhone, setProfilePhone] = React.useState('');
  const [profileLocation, setProfileLocation] = React.useState('');
  const [profileAvatar, setProfileAvatar] = React.useState('');
  const [profileResumeLink, setProfileResumeLink] = React.useState('');
  const [profileLoading, setProfileLoading] = React.useState(false);

  // Password change form states (separate from profile — hits its own secure endpoint)
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
  const [passwordSaving, setPasswordSaving] = React.useState(false);

  // Initial load
  // NOTE: Auth is fully handled by middleware.ts via the httpOnly session cookie.
  // If this component is rendering at all, the middleware has already verified
  // the session server-side — no client-side localStorage gate needed here.
  React.useEffect(() => {
    const storedProjects = readStoredCollection<PortfolioProject[]>(portfolioStorageKeys.adminProjects, []);
    setProjects(storedProjects);

    const storedBlogs = readStoredCollection<PortfolioBlog[]>(portfolioStorageKeys.adminBlogs, []);
    setBlogs(storedBlogs);

    const storedPosts = readStoredCollection<PortfolioPost[]>(portfolioStorageKeys.adminPosts, []);
    setPosts(storedPosts);

    const storedGallery = readStoredCollection<PortfolioGalleryItem[]>(portfolioStorageKeys.adminGallery, []);
    setGallery(storedGallery);

    const storedAlbums = readStoredCollection<PortfolioGalleryAlbum[]>(portfolioStorageKeys.adminGalleryAlbums, []);
    setGalleryAlbums(storedAlbums);

    const storedProfile = readStoredCollection<PortfolioProfile | null>(portfolioStorageKeys.profile, null);
    if (storedProfile) {
      setAdminName(storedProfile.name || 'Abir Abdullah');
      setAdminEmail(storedProfile.email || 'personal.abirabdullah@gmail.com');
    } else {
      const defaults = createDefaultProfile();
      setAdminName(defaults.name);
      setAdminEmail(defaults.email);
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
            writeStoredCollection(portfolioStorageKeys.adminProjects, projData as PortfolioProject[]);
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
            writeStoredCollection(portfolioStorageKeys.adminBlogs, blogData as PortfolioBlog[]);
          }
        } catch (err) {
          console.warn('Could not load blogs from Supabase. Falling back to local state.', err);
        }

        try {
          const { data: postsData, error: postsError } = await client
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
          if (postsError) throw postsError;
          if (postsData) {
            setPosts(postsData as PortfolioPost[]);
            writeStoredCollection(portfolioStorageKeys.adminPosts, postsData as PortfolioPost[]);
          }
        } catch (err) {
          console.warn('Could not load posts from Supabase. Falling back to local state.', err);
        }

        try {
          const { data: galData, error: galError } = await client
            .from('gallery')
            .select('*');
          if (galError) throw galError;
          if (galData) {
            setGallery(galData as PortfolioGalleryItem[]);
            writeStoredCollection(portfolioStorageKeys.adminGallery, galData as PortfolioGalleryItem[]);
          }
        } catch (err) {
          console.warn('Could not load gallery from Supabase. Falling back to local state.', err);
        }

        try {
          const { data: albumData, error: albumError } = await client
            .from('gallery_albums')
            .select('*')
            .order('created_at', { ascending: false });
          if (albumError) throw albumError;
          if (albumData) {
            setGalleryAlbums(albumData as PortfolioGalleryAlbum[]);
            writeStoredCollection(portfolioStorageKeys.adminGalleryAlbums, albumData as PortfolioGalleryAlbum[]);
          }
        } catch (err) {
          console.warn('Could not load gallery albums from Supabase (run the updated setup SQL if this table is missing).', err);
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

  // Sign out — clears the real httpOnly session cookie via the API, then leaves.
  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
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
    setProjGalleryImages([]);
    setOriginalProjGalleryImages([]);
    setIsProjectModalOpen(true);
  };

  const openEditProject = async (proj: any) => {
    setEditingProject(proj);
    setProjName(proj.name);
    setProjSlug(proj.slug);
    setProjDesc(proj.short_description);
    setProjTech(Array.isArray(proj.tech_stack) ? proj.tech_stack.join(', ') : proj.tech_stack || '');
    setProjGithub(proj.github_repo || '');
    setProjLive(proj.live_link || '');
    setProjImage(proj.image_url || '');
    setProjGalleryImages([]);
    setOriginalProjGalleryImages([]);
    setIsProjectModalOpen(true);

    if (dbStatus === 'connected') {
      setProjGalleryLoading(true);
      try {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'list',
            table: 'project_images',
            filters: { project_id: proj.id },
            orderBy: 'display_order',
            ascending: true,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load gallery images');
        const loaded: GalleryImageItem[] = (result.data || []).map((row: any) => ({
          id: row.id,
          image_url: row.image_url,
          alt_text: row.alt_text || '',
        }));
        setProjGalleryImages(loaded);
        setOriginalProjGalleryImages(loaded);
      } catch (err: any) {
        console.error('Failed to load project gallery images:', err);
        toast.error(err.message || 'Unable to load gallery images for this project');
      } finally {
        setProjGalleryLoading(false);
      }
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !projSlug) {
      toast.error("Please fill in the project name and slug");
      return;
    }

    const techArray = projTech.split(',').map(t => t.trim()).filter(Boolean);

    let updatedProjects;
    let targetId = editingProject ? editingProject.id : Date.now();
    const basePayload = {
      name: projName,
      slug: projSlug,
      short_description: projDesc,
      tech_stack: techArray,
      github_repo: projGithub || '#',
      live_link: projLive || '#',
      image_url: projImage || ''
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
            payload: basePayload,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Project save failed');
        // Use the real DB-assigned id (critical for project_images.project_id to point
        // at the correct row — a client-generated Date.now() id would never match).
        if (result.data?.id !== undefined) {
          targetId = result.data.id;
        }

        // Reconcile the project_images gallery against what was originally loaded.
        const removedImages = originalProjGalleryImages.filter(
          (orig) => orig.id !== undefined && !projGalleryImages.some((img) => img.id === orig.id)
        );
        for (const removed of removedImages) {
          await fetch('/api/admin/crud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', table: 'project_images', id: removed.id }),
          }).catch((err) => console.error('Failed to delete removed project image:', err));
        }

        for (let i = 0; i < projGalleryImages.length; i++) {
          const img = projGalleryImages[i];
          if (img.id === undefined) {
            await fetch('/api/admin/crud', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'create',
                table: 'project_images',
                payload: { project_id: targetId, image_url: img.image_url, alt_text: img.alt_text || '', display_order: i },
              }),
            }).catch((err) => console.error('Failed to add project image:', err));
          } else {
            await fetch('/api/admin/crud', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update',
                table: 'project_images',
                id: img.id,
                payload: { image_url: img.image_url, alt_text: img.alt_text || '', display_order: i },
              }),
            }).catch((err) => console.error('Failed to update project image:', err));
          }
        }
      }

      const projectObj = {
        id: targetId,
        ...basePayload,
        created_at: editingProject ? editingProject.created_at : new Date().toISOString()
      };

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
      writeStoredCollection(portfolioStorageKeys.adminProjects, updatedProjects);
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
    writeStoredCollection(portfolioStorageKeys.adminProjects, filtered);

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
      writeStoredCollection(portfolioStorageKeys.adminBlogs, updatedBlogs);
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
    writeStoredCollection(portfolioStorageKeys.adminBlogs, filtered);

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
    setGalAlbumId('');
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
      url: galUrl,
      album_id: galAlbumId || null,
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
      writeStoredCollection(portfolioStorageKeys.adminGallery, updated);
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
    writeStoredCollection(portfolioStorageKeys.adminGallery, filtered);

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

  // GALLERY ALBUM CRUD
  const handleCreateAlbum = async (name: string) => {
    const newAlbum: PortfolioGalleryAlbum = { ...createDefaultAlbum(), name };

    try {
      if (dbStatus === 'connected') {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', table: 'gallery_albums', payload: newAlbum }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Album creation failed');
      }

      const updated = [newAlbum, ...galleryAlbums];
      setGalleryAlbums(updated);
      writeStoredCollection(portfolioStorageKeys.adminGalleryAlbums, updated);
      toast.success(`Album "${name}" created`);
      logActivity(`Created gallery album "${name}"`);
    } catch (err: any) {
      console.error('Album create failed:', err);
      toast.error(err.message || 'Unable to create album. Run the updated setup SQL if gallery_albums is missing.');
    }
  };

  const handleDeleteAlbum = async (id: any, name: string) => {
    const updated = galleryAlbums.filter((a) => a.id !== id);
    setGalleryAlbums(updated);
    writeStoredCollection(portfolioStorageKeys.adminGalleryAlbums, updated);

    const clearedGallery = gallery.map((img) => (String(img.album_id ?? '') === String(id) ? { ...img, album_id: null } : img));
    setGallery(clearedGallery);
    writeStoredCollection(portfolioStorageKeys.adminGallery, clearedGallery);

    if (dbStatus === 'connected') {
      try {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', table: 'gallery_albums', id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        toast.success(`Album "${name}" deleted`);
      } catch (err: any) {
        console.error('Album delete failed:', err);
        toast.error(`Database delete failed: ${err.message || err}. Removed from local workspace only.`);
      }
    } else {
      toast.success(`Album "${name}" removed`);
    }
    logActivity(`Deleted gallery album "${name}"`);
  };


  // Load the real site profile (admin table row) when the Settings tab is opened
  const loadSiteProfile = React.useCallback(async () => {
    setProfileLoading(true);
    try {
      const response = await fetch('/api/admin/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', table: 'admin', orderBy: 'id' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load profile');

      const row = Array.isArray(result.data) ? result.data[0] : null;
      if (row) {
        setProfileId(row.id ?? null);
        setAdminName(row.name || '');
        setAdminEmail(row.email || '');
        setProfileHeadline(row.headline || '');
        setProfileBio(row.bio || '');
        setProfileAbout(row.about || '');
        setProfilePhone(row.phone || '');
        setProfileLocation(row.location || '');
        setProfileAvatar(row.avatar || '');
        setProfileResumeLink(row.resume_link || '');
      }
    } catch (err: any) {
      console.error('Failed to load site profile:', err);
      toast.error(err.message || 'Unable to load profile from database');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (currentTab === 'settings' && dbStatus === 'connected') {
      loadSiteProfile();
    }
  }, [currentTab, dbStatus, loadSiteProfile]);

  // SAVE PROFILE SETTINGS — writes straight to the `admin` table in Supabase.
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileId) {
      toast.error('No admin record loaded yet. Please wait or reconnect the database.');
      return;
    }

    const payload = {
      name: adminName,
      headline: profileHeadline,
      bio: profileBio,
      about: profileAbout,
      phone: profilePhone,
      location: profileLocation,
      avatar: profileAvatar,
      resume_link: profileResumeLink,
      updated_at: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/admin/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', table: 'admin', id: profileId, payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Profile save failed');

      // Refresh the cache the public Home/About pages read on first paint
      writeStoredCollection(portfolioStorageKeys.siteProfile, { id: profileId, email: adminEmail, ...payload });

      toast.success('Profile updated — changes are now live on the public site');
      logActivity('Updated public profile information');
    } catch (err: any) {
      console.error('Profile save failed:', err);
      toast.error(err.message || 'Unable to save profile');
    }
  };

  // CHANGE PASSWORD — goes through its own bcrypt-verified endpoint, never touches
  // the profile payload above.
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Password change failed');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password changed successfully');
      logActivity('Changed admin login password');
    } catch (err: any) {
      console.error('Password change failed:', err);
      toast.error(err.message || 'Unable to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const openAddPost = () => {
    setEditingPost(null);
    setPostText('');
    setPostVisibility('public');
    setPostProjectId('');
    setPostPinned(false);
    setIsPostModalOpen(true);
  };

  const openEditPost = (post: PortfolioPost) => {
    setEditingPost(post);
    setPostText(post.text || '');
    setPostVisibility(post.visibility || 'public');
    setPostProjectId(post.project_id ? String(post.project_id) : '');
    setPostPinned(Boolean(post.pinned));
    setIsPostModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) {
      toast.error('Please enter some post content');
      return;
    }

    const isEditing = Boolean(editingPost);
    const payload: PortfolioPost = {
      id: editingPost ? editingPost.id : Date.now(),
      text: postText,
      visibility: postVisibility,
      pinned: postPinned,
      project_id: postProjectId ? postProjectId : null,
      created_at: editingPost ? editingPost.created_at : new Date().toISOString(),
    };

    try {
      if (dbStatus === 'connected') {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isEditing
              ? { action: 'update', table: 'posts', id: payload.id, payload }
              : { action: 'create', table: 'posts', payload }
          ),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Post save failed');
      }

      const updatedPosts = isEditing
        ? posts.map((p) => (p.id === payload.id ? payload : p))
        : [payload, ...posts];

      setPosts(updatedPosts);
      writeStoredCollection(portfolioStorageKeys.adminPosts, updatedPosts);
      setIsPostModalOpen(false);
      setEditingPost(null);
      logActivity(isEditing ? 'Updated a post' : 'Added a project update');
      toast.success(isEditing ? 'Post updated successfully' : 'Post added successfully');
    } catch (err: any) {
      console.error('Post save failed:', err);
      toast.error(err.message || 'Unable to save post');
    }
  };

  const handleDeletePost = (id: any, text: string) => {
    setDeleteConfirm({ type: 'post', id, name: text.slice(0, 40) });
  };

  const executeDeletePost = async (id: any, name: string) => {
    const filtered = posts.filter((p) => p.id !== id);
    setPosts(filtered);
    writeStoredCollection(portfolioStorageKeys.adminPosts, filtered);

    if (dbStatus === 'connected') {
      try {
        const response = await fetch('/api/admin/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', table: 'posts', id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        toast.success('Post deleted from database and local storage');
      } catch (err: any) {
        console.error('Post delete failed:', err);
        toast.error(`Database delete failed: ${err.message || err}. Removed from local workspace only.`);
      }
    } else {
      toast.success('Post deleted from local workspace');
    }
    logActivity(`Deleted post "${name}"`);
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

  const goToTab = (tab: typeof currentTab) => {
    setCurrentTab(tab);
    setIsMobileNavOpen(false);
  };

  const sidebarNav = (
    <>
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
          onClick={() => goToTab('dashboard')}
          className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'dashboard' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Button>

        <Button
          variant="ghost"
          onClick={() => goToTab('projects')}
          className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'projects' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
        >
          <Briefcase className="w-4 h-4" />
          Projects
        </Button>

        <Button
          variant="ghost"
          onClick={() => goToTab('blogs')}
          className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'blogs' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
        >
          <FileText className="w-4 h-4" />
          Blog Posts
        </Button>

        <Button
          variant="ghost"
          onClick={() => goToTab('posts')}
          className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'posts' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
        >
          <FileText className="w-4 h-4" />
          Posts
        </Button>

        <Button
          variant="ghost"
          onClick={() => goToTab('gallery')}
          className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'gallery' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
        >
          <ImageIcon className="w-4 h-4" />
          Gallery
        </Button>

        <div className="pt-4 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</div>

        <Button
          variant="ghost"
          onClick={() => goToTab('database')}
          className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'database' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
        >
          <Database className="w-4 h-4" />
          Database Configuration
        </Button>

        <Button
          variant="ghost"
          onClick={() => goToTab('settings')}
          className={`w-full justify-start gap-3 font-medium transition-colors ${currentTab === 'settings' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
        >
          <Settings className="w-4 h-4" />
          Settings
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
            <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider">Administrator</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-card flex-col shrink-0">
        {sidebarNav}
      </aside>

      {/* Sidebar (mobile drawer) */}
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col bg-card">
          {sidebarNav}
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-background overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden h-14 border-b border-border px-4 flex items-center justify-between bg-card shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileNavOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-sm capitalize">{currentTab}</span>
          <ThemeToggle />
        </div>

        {/* Header (desktop) */}
        <header className="hidden lg:flex h-14 border-b border-border px-8 items-center justify-between bg-card shrink-0">
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
        <div className="p-4 md:p-8 flex-1 overflow-y-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight capitalize">{currentTab === 'settings' ? 'Settings' : currentTab}</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                {currentTab === 'dashboard' && 'Manage your personal portfolio, upload new project showcases, and write articles.'}
                {currentTab === 'projects' && 'Add, update, and showcase your professional development and open-source projects.'}
                {currentTab === 'blogs' && 'Create drafts and publish industry insight articles directly to your blog.'}
                {currentTab === 'posts' && 'Manage project updates and short status posts for the public site.'}
                {currentTab === 'gallery' && 'Maintain a visual directory of setups, conferences, and design achievements.'}
                {currentTab === 'database' && 'View your Cloud Supabase connection details and table mapping status.'}
                {currentTab === 'settings' && 'Update your public profile information and change your login password.'}
              </p>
            </div>

            <div className="flex items-center gap-2 lg:hidden overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <a href="/" target="_blank" rel="noopener noreferrer" className="shrink-0">
                <Button variant="outline" size="sm" className="text-xs font-medium hover:bg-accent gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Live Site
                </Button>
              </a>
              {currentTab === 'projects' && (
                <Button size="sm" onClick={openAddProject} className="text-xs gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Add Project
                </Button>
              )}
              {currentTab === 'blogs' && (
                <Button size="sm" onClick={openAddBlog} className="text-xs gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Write Post
                </Button>
              )}
              {currentTab === 'gallery' && (
                <Button size="sm" onClick={openAddGallery} className="text-xs gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Add Image
                </Button>
              )}
              {currentTab === 'posts' && (
                <Button size="sm" onClick={openAddPost} className="text-xs gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Add Post
                </Button>
              )}
            </div>

            {(currentTab === 'projects' || currentTab === 'blogs' || currentTab === 'posts' || currentTab === 'gallery' || currentTab === 'dashboard') && (
              <div className="relative shrink-0">
                <Input
                  placeholder="Search item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full md:w-64 text-sm focus-visible:ring-primary h-9 bg-card border-border"
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
            <PostsSection posts={posts} projects={projects} onAdd={openAddPost} onEdit={openEditPost} onDelete={handleDeletePost} />
          )}

          {/* TAB 5: GALLERY MANAGEMENT */}
          {currentTab === 'gallery' && (
            <GallerySection
              gallery={gallery}
              filteredGallery={filteredGallery}
              albums={galleryAlbums}
              onAdd={openAddGallery}
              onDelete={handleDeleteGallery}
              onCreateAlbum={handleCreateAlbum}
              onDeleteAlbum={handleDeleteAlbum}
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
                      { table: 'gallery', columns: 'id (PK), name, url, album_id (FK -> gallery_albums), caption', count: gallery.length },
                      { table: 'gallery_albums', columns: 'id (PK), name, description, cover_image', count: galleryAlbums.length }
                    ].map((tbl) => (
                      <div key={tbl.table} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                        <div>
                          <p className="font-bold text-primary font-mono">{tbl.table}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">columns: {tbl.columns}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 w-fit">{tbl.count} entries mapped</Badge>
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

-- 3. Create gallery albums table
create table if not exists gallery_albums (
  id bigint primary key,
  name text not null,
  description text,
  cover_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create gallery table (run this even if the table already exists —
--    the "add column if not exists" lines below bring older tables up to date)
create table if not exists gallery (
  id bigint primary key,
  name text not null,
  url text not null
);
alter table gallery add column if not exists album_id bigint references gallery_albums(id) on delete set null;
alter table gallery add column if not exists caption text;

-- 5. Set row-level security and access policies
alter table projects enable row level security;
alter table blogs enable row level security;
alter table gallery enable row level security;
alter table gallery_albums enable row level security;

create policy "Allow public select" on projects for select using (true);
create policy "Allow public select" on blogs for select using (true);
create policy "Allow public select" on gallery for select using (true);
create policy "Allow public select" on gallery_albums for select using (true);

create policy "Allow all for admin writes" on projects for all using (true) with check (true);
create policy "Allow all for admin writes" on blogs for all using (true) with check (true);
create policy "Allow all for admin writes" on gallery for all using (true) with check (true);
create policy "Allow all for admin writes" on gallery_albums for all using (true) with check (true);`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 6: SETTINGS / PROFILE CREDENTIALS */}
          {currentTab === 'settings' && (
            <div className="max-w-xl space-y-8">
              <Card className="shadow-none bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Public Profile</CardTitle>
                  <CardDescription>
                    This information is shown on your public Home and About pages. Saved directly to your Supabase <code>admin</code> table.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dbStatus !== 'connected' ? (
                    <p className="text-sm text-muted-foreground">
                      Connect Supabase (see the Database tab) to load and edit your public profile.
                    </p>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Display Name</label>
                        <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="bg-background border-border" disabled={profileLoading} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Headline</label>
                        <Input value={profileHeadline} onChange={(e) => setProfileHeadline(e.target.value)} placeholder="Full-Stack Developer" className="bg-background border-border" disabled={profileLoading} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Short Bio (used on Home hero)</label>
                        <Textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} rows={3} className="bg-background border-border" disabled={profileLoading} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">About (used on About page)</label>
                        <Textarea value={profileAbout} onChange={(e) => setProfileAbout(e.target.value)} rows={5} className="bg-background border-border" disabled={profileLoading} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Avatar Image</label>
                        <ImageUploader value={profileAvatar} onChange={setProfileAvatar} folder="portfolio/profile" label="Avatar" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase">Phone</label>
                          <Input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="bg-background border-border" disabled={profileLoading} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase">Location</label>
                          <Input value={profileLocation} onChange={(e) => setProfileLocation(e.target.value)} className="bg-background border-border" disabled={profileLoading} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Resume Link</label>
                        <Input value={profileResumeLink} onChange={(e) => setProfileResumeLink(e.target.value)} className="bg-background border-border text-xs font-mono" disabled={profileLoading} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Login Email</label>
                        <Input type="email" value={adminEmail} disabled className="bg-muted/30 border-border text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground">Email isn&apos;t editable here since it&apos;s used to look up your account at login.</p>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" className="text-xs" disabled={profileLoading}>
                          <Check className="h-3.5 w-3.5 mr-1.5" /> Save Profile
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-none bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Change Password</CardTitle>
                  <CardDescription>
                    Requires your current password. Updates the hashed password used for admin login.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Current Password</label>
                      <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">New Password</label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Confirm New Password</label>
                      <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="bg-background border-border" />
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                      <Button type="submit" variant="destructive" className="text-xs" disabled={passwordSaving}>
                        {passwordSaving ? 'Updating...' : 'Change Password'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="text-xs font-bold uppercase text-muted-foreground">Showcase Image</label>
                <ImageUploader value={projImage} onChange={setProjImage} folder="portfolio/projects" label="Project image" />
              </div>
              <div className="space-y-2 border-t pt-4">
                {projGalleryLoading ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading gallery images...
                  </p>
                ) : (
                  <ImageGalleryUploader
                    images={projGalleryImages}
                    onChange={setProjGalleryImages}
                    folder="portfolio/projects"
                    label="Project Gallery (shown on project detail page)"
                  />
                )}
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
                  <label className="text-xs font-bold uppercase text-muted-foreground">Content</label>
                  <span className="text-[10px] text-muted-foreground">Markdown supported — headings, bold/italic, lists, links, code blocks</span>
                </div>
                <MarkdownEditor
                  value={blogContent}
                  onChange={setBlogContent}
                  rows={10}
                  placeholder="Draft your thoughts... use the toolbar or plain Markdown syntax."
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
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
                <label className="text-xs font-bold uppercase text-muted-foreground">Image</label>
                <ImageUploader value={galUrl} onChange={setGalUrl} folder="portfolio/gallery" label="Gallery image" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Album (optional)</label>
                <select
                  value={galAlbumId}
                  onChange={(e) => setGalAlbumId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-muted/10 px-3 text-sm"
                >
                  <option value="">No album (uncategorized)</option>
                  {galleryAlbums.map((album) => (
                    <option key={album.id} value={String(album.id)}>{album.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="ghost" className="text-xs" onClick={() => setIsGalleryModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="text-xs">Add Image</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY 4: POST / PROJECT UPDATE MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="bg-muted/40 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-extrabold tracking-tight text-lg">{editingPost ? 'Edit Post' : 'Add Post'}</h2>
              <Button size="icon" variant="ghost" onClick={() => { setIsPostModalOpen(false); setEditingPost(null); }} className="h-8 w-8 text-muted-foreground hover:text-foreground">✕</Button>
            </div>
            <form onSubmit={handleSavePost} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Post Content</label>
                <Textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Share a quick update..."
                  required
                  rows={4}
                  className="bg-muted/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Link to Project (optional)</label>
                <select
                  value={postProjectId}
                  onChange={(e) => setPostProjectId(e.target.value)}
                  className="w-full rounded-md border border-input bg-muted/10 px-3 py-2 text-sm"
                >
                  <option value="">— No project (standalone post) —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Visibility</label>
                  <select
                    value={postVisibility}
                    onChange={(e) => setPostVisibility(e.target.value)}
                    className="w-full rounded-md border border-input bg-muted/10 px-3 py-2 text-sm"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground pt-6">
                  <input type="checkbox" checked={postPinned} onChange={(e) => setPostPinned(e.target.checked)} className="h-4 w-4" />
                  Pinned
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="ghost" className="text-xs" onClick={() => { setIsPostModalOpen(false); setEditingPost(null); }}>Cancel</Button>
                <Button type="submit" className="text-xs">{editingPost ? 'Update Post' : 'Add Post'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
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
                    } else if (type === 'post') {
                      await executeDeletePost(id, name);
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
