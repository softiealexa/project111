
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Clock,
  Calendar,
  BarChart3,
  ListTodo,
  FileText,
  DollarSign,
  Coffee,
  LayoutGrid,
  BarChart2,
  Activity,
  Briefcase,
  Users,
  Play,
  MoreVertical,
  Tag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getIconComponent } from '@/lib/icons';

const timeEntries = [
    { day: 'Today', total: '7:00', items: [
        { task: 'Illustrations', project: 'ACME', projectColor: 'text-blue-500', tags: ['EUR', 'Invoiced'], billable: true, timeRange: '1:00 PM - 3:00 PM', duration: '2:00' },
        { task: 'Fixing bug #212', project: 'Project X', projectColor: 'text-purple-500', billable: false, timeRange: '9:30 AM - 1:00 PM', duration: '3:30' },
        { task: 'Filing tax return', project: 'Office', projectColor: 'text-orange-500', tags: ['Overtime'], billable: true, timeRange: '8:00 AM - 9:30 AM', duration: '1:30' },
    ]},
    { day: 'Yesterday', total: '7:30', items: [
        { task: 'Developing new feature', project: 'Project X', projectColor: 'text-purple-500', tags: ['Overtime'], billable: true, timeRange: '3:00 PM - 6:00 PM', duration: '3:00' },
        { task: 'Interface design', project: 'ACME', projectColor: 'text-blue-500', billable: true, timeRange: '1:30 PM - 3:00 PM', duration: '1:30' },
        { task: 'Lunch', project: 'Break', projectColor: 'text-gray-500', billable: false, timeRange: '1:00 PM - 1:30 PM', duration: '0:30' },
        { task: 'Company training', project: 'Office', projectColor: 'text-orange-500', billable: true, timeRange: '10:00 AM - 1:00 PM', duration: '3:00' },
        { task: 'Add description', project: '', billable: true, timeRange: '9:00 AM - 10:00 AM', duration: '1:00' },
    ]}
];

export default function ClockifyPage() {
  const [activeMenu, setActiveMenu] = useState('Time Tracker');

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center gap-2 px-2">
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full bg-primary/10">
                        <Clock className="h-6 w-6 text-primary" />
                    </Button>
                    <h2 className="text-lg font-semibold text-foreground">Clockify</h2>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Timesheet')} isActive={activeMenu === 'Timesheet'} tooltip="Timesheet">
                            <ListTodo />
                            <span>Timesheet</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Time Tracker')} isActive={activeMenu === 'Time Tracker'} tooltip="Time Tracker">
                            <Clock />
                            <span>Time Tracker</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Calendar')} isActive={activeMenu === 'Calendar'} tooltip="Calendar">
                            <Calendar />
                            <span>Calendar</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Schedule')} isActive={activeMenu === 'Schedule'} tooltip="Schedule">
                            <BarChart3 />
                            <span>Schedule</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Expenses')} isActive={activeMenu === 'Expenses'} tooltip="Expenses">
                            <FileText />
                            <span>Expenses</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Time Off')} isActive={activeMenu === 'Time Off'} tooltip="Time Off">
                            <Coffee />
                            <span>Time Off</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <Separator className="my-2"/>
                    <span className="px-4 text-xs font-semibold uppercase text-muted-foreground">Analyze</span>

                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Dashboard')} isActive={activeMenu === 'Dashboard'} tooltip="Dashboard">
                            <LayoutGrid />
                            <span>Dashboard</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Reports')} isActive={activeMenu === 'Reports'} tooltip="Reports">
                            <BarChart2 />
                            <span>Reports</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Activity')} isActive={activeMenu === 'Activity'} tooltip="Activity">
                            <Activity />
                            <span>Activity</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <Separator className="my-2"/>
                    <span className="px-4 text-xs font-semibold uppercase text-muted-foreground">Manage</span>
                    
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Projects')} isActive={activeMenu === 'Projects'} tooltip="Projects">
                            <Briefcase />
                            <span>Projects</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActiveMenu('Team')} isActive={activeMenu === 'Team'} tooltip="Team">
                            <Users />
                            <span>Team</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    <h1 className="text-xl font-semibold">{activeMenu}</h1>
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 bg-muted/30">
                <Card className="shadow-md">
                    <CardContent className="p-2">
                        <div className="flex flex-wrap items-center gap-4 p-2">
                            <Input placeholder="What are you working on?" className="flex-1 min-w-[200px] border-none focus-visible:ring-0 focus-visible:ring-offset-0" />
                            <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                                <Briefcase className="mr-2 h-4 w-4" />
                                Project
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Tag className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <Separator orientation="vertical" className="h-6" />
                            <span className="font-semibold text-lg font-mono">00:00:00</span>
                            <Button className="bg-blue-500 hover:bg-blue-600 text-white">START</Button>
                             <Button variant="ghost" size="icon">
                                <ListTodo className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <div className="mt-6 space-y-6">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold">This week</span>
                        <span className="text-muted-foreground">Week total: <span className="font-semibold text-foreground">34:30</span></span>
                    </div>

                    {timeEntries.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                                <span className="font-semibold">{group.day}</span>
                                <span>Total: <span className="font-semibold text-foreground">{group.total}</span></span>
                            </div>
                            <div className="space-y-1">
                                {group.items.map((item, itemIndex) => (
                                    <Card key={itemIndex} className="shadow-sm">
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <span>{item.task}</span>
                                                    {item.project && <span className={`ml-2 font-semibold ${item.projectColor}`}>• {item.project}</span>}
                                                </div>
                                                <div className="hidden sm:flex items-center gap-2">
                                                    {item.tags?.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <DollarSign className={`h-4 w-4 ${item.billable ? 'text-foreground' : 'text-muted-foreground/50'}`} />
                                                </Button>
                                                <span className="hidden lg:inline-block text-sm text-muted-foreground w-36 text-center">{item.timeRange}</span>
                                                <Button variant="ghost" size="icon" className="hidden lg:inline-flex h-8 w-8">
                                                    <Calendar className="h-4 w-4" />
                                                </Button>
                                                <span className="font-bold w-16 text-right">{item.duration}</span>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
