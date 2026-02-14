

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, LoaderCircle, Plus, FileJson, Search, Filter, BookOpen, Calendar, Users, Copy, Download, Pencil, Trash2, MoreHorizontal, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { collection, query, orderBy, Timestamp, onSnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ProfileTemplate, ExamType } from '@/lib/types';
import Navbar from '@/components/navbar';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getAllTemplates,
  deleteTemplate,
  duplicateTemplate,
  exportTemplateToJSON,
  importTemplateFromJSON,
  toggleTemplateActive,
} from '@/lib/templates';

interface DisplayTemplate extends ProfileTemplate {
  id: string;
  createdAtDate?: Date;
  updatedAtDate?: Date;
}

const examTypeColors: Record<ExamType, string> = {
  JEE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  NEET: 'bg-green-500/10 text-green-500 border-green-500/20',
  BOARDS: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  CUSTOM: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const examTypeIcons: Record<ExamType, React.ReactNode> = {
  JEE: <BookOpen className="h-4 w-4" />,
  NEET: <Users className="h-4 w-4" />,
  BOARDS: <CheckCircle2 className="h-4 w-4" />,
  CUSTOM: <TrendingUp className="h-4 w-4" />,
};

export default function TemplatesAdminPage() {
  const { user, userDoc, loading: authLoading } = useData();
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DisplayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamType, setSelectedExamType] = useState<ExamType | 'ALL'>('ALL');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<DisplayTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isUserAdmin = useMemo(() => {
    return userDoc?.role === 'admin';
  }, [userDoc]);

  const handleFirestoreError = useCallback((err: any) => {
    if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED') {
      setError("Permission Denied. Please ensure you have the correct Firestore security rules in place.");
    } else if (err.code === 'failed-precondition') {
      setError(`Query requires an index. Please check the browser console for a link to create it in Firebase.`);
    } else {
      setError(`An unexpected error occurred: ${err.message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (userDoc && !isUserAdmin) {
      setLoading(false);
      return;
    }

    if (isUserAdmin) {
      if (!db) {
        setError("Database connection is not available.");
        setLoading(false);
        return;
      }

      const templatesCol = collection(db, 'templates');
      const templatesQuery = query(templatesCol, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(templatesQuery, (snapshot) => {
        const fetchedTemplates = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data() as ProfileTemplate;

          const isTimestamp = (value: any): value is Timestamp => {
            return value && typeof value.toDate === 'function';
          };

          return {
            ...data,
            id: doc.id,
            createdAtDate: data.createdAt && isTimestamp(data.createdAt) ? data.createdAt.toDate() : undefined,
            updatedAtDate: data.updatedAt && isTimestamp(data.updatedAt) ? data.updatedAt.toDate() : undefined,
          } as DisplayTemplate;
        });

        setTemplates(fetchedTemplates);
        setLoading(false);
      }, handleFirestoreError);

      return () => unsubscribe();
    }
  }, [user, authLoading, router, userDoc, isUserAdmin, handleFirestoreError]);

  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (activeTab === 'popular') {
      result = result.filter(t => t.isPopular || t.usageCount > 10);
    } else if (activeTab === 'new') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter(t => t.createdAtDate && t.createdAtDate > oneWeekAgo);
    }

    if (selectedExamType !== 'ALL') {
      result = result.filter(t => t.examType === selectedExamType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.shareCode?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [templates, activeTab, selectedExamType, searchQuery]);

  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter(t => t.isActive).length;
    const inactive = total - active;
    const totalUsage = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0);

    const byExamType = {
      JEE: templates.filter(t => t.examType === 'JEE').length,
      NEET: templates.filter(t => t.examType === 'NEET').length,
      BOARDS: templates.filter(t => t.examType === 'BOARDS').length,
      CUSTOM: templates.filter(t => t.examType === 'CUSTOM').length,
    };

    return { total, active, inactive, totalUsage, byExamType };
  }, [templates]);

  const handleExport = useCallback((template: DisplayTemplate) => {
    const json = exportTemplateToJSON(template);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Template Exported", description: `"${template.name}" has been exported.` });
  }, [toast]);

  const handleDuplicate = useCallback(async (template: DisplayTemplate) => {
    if (!user) return;

    try {
      const newName = `${template.name} (Copy)`;
      await duplicateTemplate(template.id, newName, user.uid);
      toast({ title: "Template Duplicated", description: `"${newName}" has been created.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [user, toast]);

  const handleToggleActive = useCallback(async (template: DisplayTemplate) => {
    try {
      await toggleTemplateActive(template.id, !template.isActive);
      toast({
        title: template.isActive ? "Template Deactivated" : "Template Activated",
        description: `"${template.name}" is now ${template.isActive ? 'inactive' : 'active'}.`
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const handleDelete = useCallback(async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplate(templateToDelete.id);
      toast({ title: "Template Deleted", description: `"${templateToDelete.name}" has been deleted.` });
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [templateToDelete, toast]);

  const handleImport = useCallback(async () => {
    if (!user || !importJson.trim()) return;

    setIsImporting(true);
    try {
      await importTemplateFromJSON(importJson, user.uid);
      toast({ title: "Template Imported", description: "The template has been imported successfully." });
      setImportJson('');
      setIsImportDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  }, [user, importJson, toast]);

  const handleCreateNew = useCallback(() => {
    router.push('/admin/templates/new');
  }, [router]);

  const handleEdit = useCallback((templateId: string) => {
    router.push(`/admin/templates/${templateId}`);
  }, [router]);

  if (authLoading || (user && !userDoc)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4 text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You do not have permission to view this page. Please contact the administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Template Manager</h1>
            <p className="text-muted-foreground">Manage profile templates for users.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <FileJson className="mr-2 h-4 w-4" />
              Import JSON
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.inactive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsage.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Type Stats */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['ALL', 'JEE', 'NEET', 'BOARDS', 'CUSTOM'] as const).map((type) => (
            <Button
              key={type}
              variant={selectedExamType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedExamType(type)}
              className="gap-2"
            >
              {type !== 'ALL' && examTypeIcons[type]}
              {type}
              {type !== 'ALL' && (
                <Badge variant="secondary" className="ml-1">
                  {stats.byExamType[type]}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {error ? (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList>
                <TabsTrigger value="all">All Templates</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
              </TabsList>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Filter className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">No templates found</h3>
                      <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        "group transition-all hover:shadow-md",
                        !template.isActive && "opacity-75"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate" title={template.name}>
                              {template.name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "ml-2 shrink-0",
                              examTypeColors[template.examType]
                            )}
                          >
                            {template.examType}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{template.subjects.length} Subjects</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {template.subjects.reduce((acc, s) => acc + s.chapters.length, 0)} Chapters
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{template.usageCount || 0} Uses</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {template.createdAtDate
                                ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(template.createdAtDate)
                                : 'N/A'
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <Badge
                            variant={template.isActive ? 'default' : 'secondary'}
                            className={cn(
                              template.isActive
                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                            )}
                          >
                            {template.isActive ? (
                              <><CheckCircle2 className="mr-1 h-3 w-3" /> Active</>
                            ) : (
                              <><XCircle className="mr-1 h-3 w-3" /> Inactive</>
                            )}
                          </Badge>

                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(template.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Template</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDuplicate(template)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Duplicate</TooltipContent>
                            </Tooltip>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExport(template)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Export JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                                  {template.isActive ? (
                                    <><XCircle className="mr-2 h-4 w-4" /> Deactivate</>
                                  ) : (
                                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Activate</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setTemplateToDelete(template);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Import Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Import Template from JSON</DialogTitle>
              <DialogDescription>
                Paste your template JSON below. The template will be imported as inactive and require review before activation.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{"name": "My Template", "examType": "JEE", "subjects": [...]}'
              className="min-h-[300px] font-mono text-sm"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isImporting || !importJson.trim()}>
                {isImporting ? (
                  <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                ) : (
                  <><FileJson className="mr-2 h-4 w-4" /> Import Template</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
}
