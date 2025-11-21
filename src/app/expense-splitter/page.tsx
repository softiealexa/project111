

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Coins, MoreVertical, Pencil, Check as CheckIcon, ChevronsUpDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Navbar from '@/components/navbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-context';
import type { Friend, Expense, ExpenseItem, ExpenseGroup } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogHeader, DialogFooter, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Balance {
  friend: string;
  amount: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

const NewGroupDialog = ({ open, onOpenChange, onAdd }: { open: boolean, onOpenChange: (open: boolean) => void, onAdd: (name: string) => void }) => {
    const [name, setName] = useState('');
    
    const handleAdd = () => {
        if(name.trim()) {
            onAdd(name.trim());
            setName('');
            onOpenChange(false);
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Expense Group</DialogTitle>
                    <DialogDescription>Enter a name for your new group (e.g., "Goa Trip").</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input id="group-name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleAdd}>Create Group</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function ExpenseSplitterPage() {
  const { activeProfile, setFriends, setExpenses, addExpenseGroup, deleteExpenseGroup, renameExpenseGroup, switchExpenseGroup } = useData();
  const { toast } = useToast();
  
  const [friendName, setFriendName] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseTotal, setExpenseTotal] = useState('');
  const [mode, setMode] = useState<'equal' | 'individual'>('equal');
  const [isNewGroupDialogOpen, setIsNewGroupDialogOpen] = useState(false);

  // State for Equal Split
  const [paidBy, setPaidBy] = useState<Record<string, { checked: boolean, amount: string }>>({});
  const [splitAmong, setSplitAmong] = useState<Record<string, boolean>>({});
  
  // State for Individual Split
  const [individualItems, setIndividualItems] = useState<{ id: number, person: string, itemName: string, price: string }[]>([]);
  const [individualPaidBy, setIndividualPaidBy] = useState<string>('');
  const [itemCounter, setItemCounter] = useState(0);

  const expenseGroups = useMemo(() => activeProfile?.expenseGroups || [], [activeProfile]);
  const activeGroupId = useMemo(() => activeProfile?.activeExpenseGroupId, [activeProfile]);
  const activeGroup = useMemo(() => expenseGroups.find(g => g.id === activeGroupId), [expenseGroups, activeGroupId]);

  const friends = useMemo(() => activeGroup?.friends || [], [activeGroup]);
  const expenses = useMemo(() => activeGroup?.expenses || [], [activeGroup]);

  useEffect(() => {
    // When the active group changes, reset the form state
    resetEqualSplitForm();
    resetIndividualItemsForm();
    setFriendName('');
  }, [activeGroupId]);

  useEffect(() => {
    // If there are no groups, create a default one.
    if (!activeProfile) return;
    if (activeProfile.expenseGroups === undefined || activeProfile.expenseGroups.length === 0) {
      addExpenseGroup("My First Group");
    } else if (!activeGroupId && activeProfile.expenseGroups.length > 0) {
      switchExpenseGroup(activeProfile.expenseGroups[0].id);
    }
  }, [activeProfile, activeGroupId, addExpenseGroup, switchExpenseGroup]);

  const addFriend = () => {
    const name = friendName.trim();
    if (!name) {
      toast({ title: 'Error', description: 'Friend\'s name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (friends.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: 'Error', description: 'This friend is already added.', variant: 'destructive' });
      return;
    }
    const newFriends = [...friends, { id: crypto.randomUUID(), name }];
    setFriends && setFriends(newFriends);
    setFriendName('');
  };

  const removeFriend = (id: string) => {
    const friendToRemove = friends.find(f => f.id === id);
    if (!friendToRemove) return;
    
    const newFriends = friends.filter(f => f.id !== id);
    setFriends && setFriends(newFriends);
    
    const newExpenses = expenses.filter(e => {
        if (e.paidBy?.some(p => p.name === friendToRemove.name)) return false;
        if (e.mode === 'equal') {
            return !e.splitAmong?.includes(friendToRemove.name);
        } else {
            return !e.items?.some(item => item.person === friendToRemove.name);
        }
    });
    setExpenses && setExpenses(newExpenses);
  };

  const addIndividualItem = () => {
    setIndividualItems(prev => [...prev, { id: itemCounter, person: '', itemName: '', price: '' }]);
    setItemCounter(prev => prev + 1);
  };

  const removeIndividualItem = (id: number) => {
    setIndividualItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleIndividualItemChange = (id: number, field: string, value: string) => {
    setIndividualItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addExpense = () => {
    const name = expenseName.trim();
    if (!name) {
      toast({ title: 'Error', description: 'Please enter an expense name.', variant: 'destructive' });
      return;
    }
    if (friends.length === 0) {
      toast({ title: 'Error', description: 'Please add friends first.', variant: 'destructive' });
      return;
    }

    if (mode === 'equal') {
      addEqualSplitExpense(name);
    } else {
      addIndividualItemsExpense(name);
    }
  };
  
  const addEqualSplitExpense = (name: string) => {
      const total = parseFloat(expenseTotal);
      if (isNaN(total) || total <= 0) {
        toast({ title: 'Error', description: 'Please enter a valid total amount.', variant: 'destructive' });
        return;
      }
      
      const paidByPeople = Object.entries(paidBy).filter(([, val]) => val.checked).map(([key]) => key);
      if (paidByPeople.length === 0) {
        toast({ title: 'Error', description: 'Please select who paid.', variant: 'destructive' });
        return;
      }

      const splitAmongPeople = Object.entries(splitAmong).filter(([, val]) => val).map(([key]) => key);
      if (splitAmongPeople.length === 0) {
        toast({ title: 'Error', description: 'Please select who to split among.', variant: 'destructive' });
        return;
      }

      const customAmounts = paidByPeople.map(p => ({ name: p, amount: parseFloat(paidBy[p].amount) || 0 })).filter(p => p.amount > 0);
      const hasCustomAmounts = customAmounts.length > 0;
      
      let payments: { name: string; amount: number }[] = [];
      
      if (hasCustomAmounts) {
        const customTotal = customAmounts.reduce((sum, p) => sum + p.amount, 0);
        if (Math.abs(customTotal - total) > 0.01) {
          toast({ title: 'Error', description: `Custom amounts (₹${customTotal.toFixed(2)}) don't match total (₹${total.toFixed(2)}).`, variant: 'destructive' });
          return;
        }
        payments = customAmounts;
      } else {
        payments = paidByPeople.map(p => ({ name: p, amount: total / paidByPeople.length }));
      }
      
      const newExpense: Expense = { id: crypto.randomUUID(), name, mode: 'equal', total, paidBy: payments, splitAmong: splitAmongPeople };
      setExpenses && setExpenses([...expenses, newExpense]);
      resetEqualSplitForm();
  };

  const addIndividualItemsExpense = (name: string) => {
      if(individualItems.length === 0) {
          toast({ title: 'Error', description: 'Please add at least one item.', variant: 'destructive' });
          return;
      }
      const validItems = individualItems.filter(item => item.person && item.itemName && parseFloat(item.price) > 0);
      if (validItems.length !== individualItems.length) {
          toast({ title: 'Error', description: 'Please fill all item details correctly.', variant: 'destructive' });
          return;
      }
      if (!individualPaidBy) {
        toast({ title: 'Error', description: 'Please select who paid for the items.', variant: 'destructive' });
        return;
      }

      const items = validItems.map(item => ({ person: item.person, itemName: item.itemName, price: parseFloat(item.price)}));
      const total = items.reduce((sum, item) => sum + item.price, 0);
      
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        name,
        mode: 'individual',
        total,
        paidBy: [{ name: individualPaidBy, amount: total }],
        items
      };
      setExpenses && setExpenses([...expenses, newExpense]);
      resetIndividualItemsForm();
  };

  const resetEqualSplitForm = () => {
    setExpenseName('');
    setExpenseTotal('');
    setPaidBy({});
    setSplitAmong({});
  };

  const resetIndividualItemsForm = () => {
    setExpenseName('');
    setIndividualItems([]);
    setIndividualPaidBy('');
  };

  const removeExpense = (id: string) => {
    const newExpenses = expenses.filter(e => e.id !== id);
    setExpenses && setExpenses(newExpenses);
  };
  
  const resetAll = () => {
    if(!activeGroup) return;
    setFriends && setFriends([]);
    setExpenses && setExpenses([]);
    setFriendName('');
    resetEqualSplitForm();
    resetIndividualItemsForm();
  };

  const { balances, settlements, totalSpent, avgPerPerson } = useMemo(() => {
    const balancesMap: Record<string, number> = {};
    friends.forEach(f => balancesMap[f.name] = 0);

    expenses.forEach(expense => {
        expense.paidBy.forEach(payment => {
            if (balancesMap[payment.name] !== undefined) {
                balancesMap[payment.name] += payment.amount;
            }
        });
        
        if (expense.mode === 'equal') {
            const perPerson = expense.total / expense.splitAmong!.length;
            expense.splitAmong!.forEach(person => {
                if (balancesMap[person] !== undefined) {
                    balancesMap[person] -= perPerson;
                }
            });
        } else { // individual
            expense.items!.forEach(item => {
                if(balancesMap[item.person] !== undefined) {
                    balancesMap[item.person] -= item.price;
                }
            });
        }
    });

    const debtors = Object.entries(balancesMap).filter(([,b]) => b < -0.01).map(([p, a]) => ({ person: p, amount: -a }));
    const creditors = Object.entries(balancesMap).filter(([,b]) => b > 0.01).map(([p, a]) => ({ person: p, amount: a }));
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    const settlements: Settlement[] = [];
    let i = 0, j = 0;
    while(i < debtors.length && j < creditors.length) {
      const debt = Math.min(debtors[i].amount, creditors[j].amount);
      settlements.push({ from: debtors[i].person, to: creditors[j].person, amount: debt });
      debtors[i].amount -= debt;
      creditors[j].amount -= debt;
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }
    
    const totalSpent = expenses.reduce((sum, e) => sum + e.total, 0);
    const avgPerPerson = friends.length > 0 ? totalSpent / friends.length : 0;
    
    return {
      balances: friends.map(f => ({ friend: f.name, amount: balancesMap[f.name] || 0 })),
      settlements,
      totalSpent,
      avgPerPerson,
    };
  }, [friends, expenses]);

  const shareSummary = () => {
     if (!activeGroup) return;
     let summary = `💰 Expense Summary: ${activeGroup.name}\n\n`;
     summary += `👥 Friends: ${friends.map(f => f.name).join(', ')}\n`;
     summary += `💵 Total Spent: ₹${totalSpent.toFixed(2)}\n`;
     summary += `📊 Per Person Avg: ₹${avgPerPerson.toFixed(2)}\n\n`;
     
     summary += '📝 Expenses:\n';
     expenses.forEach(e => {
        summary += `• ${e.name} - ₹${e.total.toFixed(2)}\n`;
     });
     summary += '\n';

     summary += '💳 Individual Balances:\n';
     balances.forEach(b => {
        if (b.amount > 0.01) summary += `• ${b.friend}: Gets back ₹${b.amount.toFixed(2)}\n`;
        else if (b.amount < -0.01) summary += `• ${b.friend}: Owes ₹${Math.abs(b.amount).toFixed(2)}\n`;
        else summary += `• ${b.friend}: All settled\n`;
     });
     summary += '\n';

     summary += '🤝 Settlement Plan:\n';
     if(settlements.length === 0) summary += '• All settled up! 🎉\n';
     else settlements.forEach(s => summary += `• ${s.from} pays ₹${s.amount.toFixed(2)} to ${s.to}\n`);

     navigator.clipboard.writeText(summary)
      .then(() => toast({ title: "Copied!", description: "Summary copied to clipboard." }))
      .catch(() => toast({ title: "Error", description: "Could not copy summary.", variant: 'destructive'}));
  };
  
  return (
    <TooltipProvider>
      <Navbar />
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Coins className="h-8 w-8 text-primary"/>
            Group Expense Splitter
            </h1>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Manage Groups</CardTitle>
                        <CardDescription>Create or switch between different expense groups.</CardDescription>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-[200px] justify-between">
                                <span className="truncate">{activeGroup?.name || 'Select Group'}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px]">
                            <DropdownMenuLabel>Switch Group</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {expenseGroups.map(group => (
                                <DropdownMenuItem key={group.id} onSelect={() => switchExpenseGroup(group.id)}>
                                    <CheckIcon className={activeGroupId === group.id ? "mr-2 h-4 w-4" : "mr-2 h-4 w-4 opacity-0"} />
                                    {group.name}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setIsNewGroupDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                <span>New Group</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem disabled={!activeGroup} onSelect={() => {
                                const newName = prompt('Enter new group name:', activeGroup?.name);
                                if (newName && activeGroup) renameExpenseGroup(activeGroup.id, newName);
                            }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Rename</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem disabled={!activeGroup} onSelect={() => activeGroup && deleteExpenseGroup(activeGroup.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
            </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                {/* Friends Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>👥 Friends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input
                                id="friendName"
                                placeholder="Enter name and press Enter"
                                value={friendName}
                                onChange={(e) => setFriendName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addFriend()}
                                disabled={!activeGroup}
                            />
                            <Button onClick={addFriend} disabled={!activeGroup}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                        </div>
                        <div className="mt-4 space-y-2">
                            {friends.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground py-4">No friends added yet.</p>
                            ) : friends.map(friend => (
                                <div key={friend.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                <span>{friend.name}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFriend(friend.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>💵 Add Expense</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={mode} onValueChange={(v) => setMode(v as 'equal' | 'individual')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="equal" disabled={!activeGroup}>📊 Equal Split</TabsTrigger>
                                <TabsTrigger value="individual" disabled={!activeGroup}>🛍️ Individual Items</TabsTrigger>
                            </TabsList>
                            
                            <div className="my-4">
                            <Label htmlFor="expenseName">Expense Name</Label>
                            <Input id="expenseName" placeholder="e.g., Dinner at Restaurant" value={expenseName} onChange={(e) => setExpenseName(e.target.value)} disabled={!activeGroup} />
                            </div>

                            <TabsContent value="equal" className="space-y-4">
                                <div>
                                    <Label htmlFor="expenseTotal">Total Amount (₹)</Label>
                                    <Input id="expenseTotal" type="number" placeholder="0.00" value={expenseTotal} onChange={(e) => setExpenseTotal(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Who Paid?</Label>
                                    <div className="space-y-2 mt-2 rounded-md border p-3">
                                    {friends.length > 0 ? friends.map(f => (
                                        <div key={`paid-${f.id}`} className="flex items-center gap-2">
                                            <Checkbox id={`paid-${f.id}`} checked={paidBy[f.name]?.checked || false} onCheckedChange={(c) => setPaidBy(prev => ({...prev, [f.name]: {checked: !!c, amount: ''}}))} />
                                            <Label htmlFor={`paid-${f.id}`} className="flex-1">{f.name}</Label>
                                            {paidBy[f.name]?.checked && <Input type="number" placeholder="Amount" className="h-8 w-28" value={paidBy[f.name]?.amount} onChange={(e) => setPaidBy(prev => ({...prev, [f.name]: {...prev[f.name], amount: e.target.value}}))} />}
                                        </div>
                                    )) : <p className="text-sm text-muted-foreground text-center py-2">Add friends first</p>}
                                    </div>
                                </div>
                                <div>
                                    <Label>Split Among</Label>
                                    <div className="space-y-2 mt-2 rounded-md border p-3">
                                    {friends.length > 0 ? friends.map(f => (
                                        <div key={`split-${f.id}`} className="flex items-center gap-2">
                                            <Checkbox id={`split-${f.id}`} checked={splitAmong[f.name] || false} onCheckedChange={(c) => setSplitAmong(prev => ({...prev, [f.name]: !!c}))} />
                                            <Label htmlFor={`split-${f.id}`}>{f.name}</Label>
                                        </div>
                                    )) : <p className="text-sm text-muted-foreground text-center py-2">Add friends first</p>}
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="individual" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Paid By</Label>
                                    <Select value={individualPaidBy} onValueChange={setIndividualPaidBy}>
                                        <SelectTrigger><SelectValue placeholder="Who paid?"/></SelectTrigger>
                                        <SelectContent>{friends.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {individualItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-2">
                                        <Select value={item.person} onValueChange={(v) => handleIndividualItemChange(item.id, 'person', v)}>
                                                <SelectTrigger><SelectValue placeholder="Person"/></SelectTrigger>
                                                <SelectContent>{friends.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Input placeholder="Item name" value={item.itemName} onChange={(e) => handleIndividualItemChange(item.id, 'itemName', e.target.value)} />
                                        <Input type="number" placeholder="Price" className="w-28" value={item.price} onChange={(e) => handleIndividualItemChange(item.id, 'price', e.target.value)} />
                                        <Button variant="ghost" size="icon" onClick={() => removeIndividualItem(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </div>
                                ))}
                                </div>
                                <Button variant="outline" onClick={addIndividualItem} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
                            </TabsContent>
                        </Tabs>
                        <Button onClick={addExpense} className="w-full mt-6" disabled={!activeGroup}><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                {/* Expenses List Card */}
                <Card>
                    <CardHeader><CardTitle>📝 Expenses</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {expenses.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-4">No expenses added yet.</p>
                        ) : expenses.map(e => (
                            <div key={e.id} className="p-4 border rounded-lg bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Badge variant="secondary" className="mb-2">{e.mode === 'equal' ? '📊 Equal Split' : '🛍️ Individual Items'}</Badge>
                                        <h3 className="font-semibold text-lg">{e.name}</h3>
                                        <p className="text-xl font-bold text-primary">₹{e.total.toFixed(2)}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeExpense(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                    <p><strong>Paid by:</strong> {e.paidBy?.map(p => `${p.name} (₹${p.amount.toFixed(2)})`).join(', ')}</p>
                                    {e.mode === 'equal' ? (
                                        <p><strong>Split among:</strong> {e.splitAmong?.join(', ')}</p>
                                    ) : (
                                        e.items?.map((item, idx) => (
                                            <p key={idx}>{item.person}: {item.itemName} (₹{item.price.toFixed(2)})</p>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Summary Card */}
                <Card>
                    <CardHeader><CardTitle>💳 Summary</CardTitle></CardHeader>
                    <CardContent>
                        <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                            <strong>Total Spent: ₹{totalSpent.toFixed(2)}</strong><br />
                            <small className="text-muted-foreground">Average per person: ₹{avgPerPerson.toFixed(2)}</small>
                        </div>
                        <div className="space-y-2 mb-6">
                            {balances.map(b => {
                                let className, text;
                                if (b.amount > 0.01) {
                                    className = "bg-green-500/10 text-green-700 dark:text-green-400 border-l-4 border-green-500";
                                    text = `Gets back ₹${b.amount.toFixed(2)}`;
                                } else if (b.amount < -0.01) {
                                    className = "bg-red-500/10 text-red-700 dark:text-red-500 border-l-4 border-red-500";
                                    text = `Owes ₹${Math.abs(b.amount).toFixed(2)}`;
                                } else {
                                    className = "bg-muted/50 border-l-4 border-transparent";
                                    text = "All settled";
                                }
                                return (
                                    <div key={b.friend} className={`flex justify-between items-center p-3 rounded-r-md ${className}`}>
                                        <strong className="text-foreground">{b.friend}</strong>
                                        <span>{text}</span>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2">🤝 Settlement Plan</h3>
                        <div className="space-y-2">
                            {settlements.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-4">All settled up! 🎉</p>
                            ) : settlements.map((s, i) => (
                                <div key={i} className="p-3 bg-blue-500/10 rounded-md text-center">
                                    <strong>{s.from}</strong> pays <strong className="text-primary">₹${s.amount.toFixed(2)}</strong> to <strong>${s.to}</strong>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex gap-2 mt-6">
                            <Button onClick={shareSummary} className="flex-1" disabled={!activeGroup}>📤 Share Summary</Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="flex-1" disabled={!activeGroup}>🔄 Reset Group</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will delete all friends and expenses in this group. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={resetAll}>Confirm Reset</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
      <NewGroupDialog open={isNewGroupDialogOpen} onOpenChange={setIsNewGroupDialogOpen} onAdd={addExpenseGroup} />
    </TooltipProvider>
  );
}
