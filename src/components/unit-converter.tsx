
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';
import { Button } from './ui/button';

type UnitCategory = 'Length' | 'Mass' | 'Temperature' | 'Volume' | 'Pressure' | 'Time' | 'Force' | 'Energy' | 'Velocity' | 'Charge' | 'Density' | 'Amount of Substance' | 'Electric Current' | 'Luminous Intensity';

const CONVERSION_FACTORS: Record<Exclude<UnitCategory, 'Temperature' | 'Amount of Substance'>, Record<string, number>> = {
  Length: {
    Meter: 1,
    Kilometer: 1000,
    Centimeter: 0.01,
    Millimeter: 0.001,
    Micrometer: 1e-6,
    Nanometer: 1e-9,
    'Ångström': 1e-10,
    Mile: 1609.34,
    Yard: 0.9144,
    Foot: 0.3048,
    Inch: 0.0254,
  },
  Mass: {
    Kilogram: 1,
    Gram: 0.001,
    Milligram: 1e-6,
    Microgram: 1e-9,
    'Atomic Mass Unit (amu)': 1.66054e-27,
    Pound: 0.453592,
    Ounce: 0.0283495,
  },
  Time: {
    Second: 1,
    Hour: 3600,
    Minute: 60,
    Millisecond: 0.001,
    Microsecond: 1e-6,
  },
  Volume: {
    'Cubic Meter': 1,
    Liter: 0.001,
    Milliliter: 1e-6,
    'US Gallon': 0.00378541,
    'US Quart': 0.000946353,
    'US Pint': 0.000473176,
    'US Cup': 0.000236588,
  },
  Pressure: {
    Pascal: 1,
    Atmosphere: 101325,
    Bar: 100000,
    Torr: 133.322,
    'mmHg': 133.322,
    'PSI (lbf/in²)': 6894.76,
  },
  Force: {
    Newton: 1,
    Dyne: 1e-5,
  },
  Energy: {
    Joule: 1,
    'Electron Volt (eV)': 1.60218e-19,
    'Calorie (cal)': 4.184,
    'Kilowatt-hour (kWh)': 3.6e6,
    Erg: 1e-7,
  },
  Velocity: {
    'm/s': 1,
    'km/h': 1 / 3.6,
  },
  Charge: {
    Coulomb: 1,
    'Ampere-hour (Ah)': 3600,
    'Faraday (F)': 96485.33212,
  },
  Density: {
      'kg/m³': 1,
      'g/cm³': 1000,
  },
  'Electric Current': {
    Ampere: 1,
    Milliampere: 0.001,
    Microampere: 1e-6,
  },
  'Luminous Intensity': {
    Candela: 1,
  }
};

const STP_MOLAR_VOLUME = 22.4; // L/mol
const AVOGADRO_CONSTANT = 6.02214076e23;

export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('Length');
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('');
  const [fromUnit, setFromUnit] = useState('Meter');
  const [toUnit, setToUnit] = useState('Foot');

  const units = useMemo(() => {
    if (category === 'Amount of Substance') return ['Mole', 'Volume at STP (L)', 'Particles'];
    return Object.keys(CONVERSION_FACTORS[category as keyof typeof CONVERSION_FACTORS] || {});
  }, [category]);

  const handleCategoryChange = (newCategory: UnitCategory) => {
    setCategory(newCategory);
    const newUnits = newCategory === 'Amount of Substance' 
      ? ['Mole', 'Volume at STP (L)', 'Particles']
      : Object.keys(CONVERSION_FACTORS[newCategory as keyof typeof CONVERSION_FACTORS]);
    setFromUnit(newUnits[0]);
    setToUnit(newUnits[1] || newUnits[0]);
    setFromValue('1');
  };

  const convert = useCallback((value: number, from: string, to: string, cat: UnitCategory) => {
    if (from === to) return value;
    
    if (cat === 'Temperature') {
      let celsius: number;
      switch (from) {
        case 'Fahrenheit': celsius = (value - 32) * 5 / 9; break;
        case 'Kelvin': celsius = value - 273.15; break;
        default: celsius = value;
      }
      switch (to) {
        case 'Fahrenheit': return celsius * 9 / 5 + 32;
        case 'Kelvin': return celsius + 273.15;
        default: return celsius;
      }
    }

    if (cat === 'Amount of Substance') {
        let moles: number;
        // To Moles
        switch(from) {
            case 'Volume at STP (L)': moles = value / STP_MOLAR_VOLUME; break;
            case 'Particles': moles = value / AVOGADRO_CONSTANT; break;
            default: moles = value; // from is 'Mole'
        }
        // From Moles
        switch(to) {
            case 'Volume at STP (L)': return moles * STP_MOLAR_VOLUME;
            case 'Particles': return moles * AVOGADRO_CONSTANT;
            default: return moles; // to is 'Mole'
        }
    }

    const factors = CONVERSION_FACTORS[cat as keyof typeof CONVERSION_FACTORS];
    if (!factors || !factors[from] || !factors[to]) return NaN;
    const baseValue = value * factors[from];
    return baseValue / factors[to];
  }, []);

  useEffect(() => {
    const value = parseFloat(fromValue);
    if (!isNaN(value)) {
      const result = convert(value, fromUnit, toUnit, category);
      setToValue(result.toLocaleString('en-US', { maximumFractionDigits: 6, useGrouping: false }));
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
                <SelectItem value="Time">Time</SelectItem>
                <SelectItem value="Volume">Volume</SelectItem>
                <SelectItem value="Pressure">Pressure</SelectItem>
                <SelectItem value="Force">Force</SelectItem>
                <SelectItem value="Energy">Energy</SelectItem>
                <SelectItem value="Velocity">Velocity</SelectItem>
                <SelectItem value="Charge">Charge</SelectItem>
                <SelectItem value="Density">Density</SelectItem>
                <SelectItem value="Amount of Substance">Amount of Substance (Chemistry)</SelectItem>
                <SelectItem value="Electric Current">Electric Current</SelectItem>
                <SelectItem value="Luminous Intensity">Luminous Intensity</SelectItem>
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
