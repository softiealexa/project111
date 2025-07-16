
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';
import { Button } from './ui/button';

type UnitCategory = 'Length' | 'Mass' | 'Temperature' | 'Volume' | 'Pressure';

const CONVERSION_FACTORS: Record<UnitCategory, Record<string, number>> = {
  Length: {
    Meter: 1,
    Kilometer: 1000,
    Centimeter: 0.01,
    Millimeter: 0.001,
    Mile: 1609.34,
    Yard: 0.9144,
    Foot: 0.3048,
    Inch: 0.0254,
  },
  Mass: {
    Gram: 1,
    Kilogram: 1000,
    Milligram: 0.001,
    Pound: 453.592,
    Ounce: 28.3495,
  },
  Volume: {
    Liter: 1,
    Milliliter: 0.001,
    'Cubic Meter': 1000,
    'US Gallon': 3.78541,
    'US Quart': 0.946353,
    'US Pint': 0.473176,
    'US Cup': 0.236588,
  },
  Pressure: {
    Pascal: 1,
    Kilopascal: 1000,
    Atmosphere: 101325,
    Torr: 133.322,
    PSI: 6894.76,
  },
  Temperature: {
    Celsius: 1, // Base for calculations
    Fahrenheit: 1,
    Kelvin: 1,
  },
};

export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('Length');
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('');
  const [fromUnit, setFromUnit] = useState('Meter');
  const [toUnit, setToUnit] = useState('Foot');

  const units = useMemo(() => Object.keys(CONVERSION_FACTORS[category]), [category]);

  const handleCategoryChange = (newCategory: UnitCategory) => {
    setCategory(newCategory);
    const newUnits = Object.keys(CONVERSION_FACTORS[newCategory]);
    setFromUnit(newUnits[0]);
    setToUnit(newUnits[1] || newUnits[0]);
    setFromValue('1');
  };

  const convert = useCallback((value: number, from: string, to: string, cat: UnitCategory) => {
    if (cat === 'Temperature') {
      if (from === to) return value;
      let celsius: number;
      // To Celsius
      switch (from) {
        case 'Fahrenheit': celsius = (value - 32) * 5 / 9; break;
        case 'Kelvin': celsius = value - 273.15; break;
        default: celsius = value;
      }
      // From Celsius
      switch (to) {
        case 'Fahrenheit': return celsius * 9 / 5 + 32;
        case 'Kelvin': return celsius + 273.15;
        default: return celsius;
      }
    } else {
      const factors = CONVERSION_FACTORS[cat];
      const baseValue = value * factors[from];
      return baseValue / factors[to];
    }
  }, []);

  useEffect(() => {
    const value = parseFloat(fromValue);
    if (!isNaN(value)) {
      const result = convert(value, fromUnit, toUnit, category);
      setToValue(result.toFixed(4).replace(/\.?0+$/, ''));
    } else {
      setToValue('');
    }
  }, [fromValue, fromUnit, toUnit, category, convert]);

  const handleFromValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromValue(e.target.value);
  };
  
  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setFromValue(toValue);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Converter</CardTitle>
        <CardDescription>
          Quickly convert units for length, mass, temperature, and more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="category-select">Conversion Type</Label>
            <Select value={category} onValueChange={(v: UnitCategory) => handleCategoryChange(v)}>
              <SelectTrigger id="category-select">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Length">Length</SelectItem>
                <SelectItem value="Mass">Mass</SelectItem>
                <SelectItem value="Temperature">Temperature</SelectItem>
                <SelectItem value="Volume">Volume</SelectItem>
                <SelectItem value="Pressure">Pressure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-4">
            {/* From Section */}
            <div className="grid gap-2">
              <Label htmlFor="from-value">From</Label>
              <Input
                id="from-value"
                type="number"
                value={fromValue}
                onChange={handleFromValueChange}
                className="text-lg"
              />
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Swap Button */}
            <Button variant="ghost" size="icon" onClick={handleSwap} className="self-center mb-10 hidden md:flex">
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                <span className="sr-only">Swap units</span>
            </Button>

            {/* To Section */}
            <div className="grid gap-2">
              <Label htmlFor="to-value">To</Label>
              <Input
                id="to-value"
                type="text"
                value={toValue}
                readOnly
                className="text-lg font-semibold bg-muted/50"
              />
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
