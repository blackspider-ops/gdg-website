import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminButton } from '@/components/ui/admin-button';

const DesignSystemShowcase = () => {
  return (
    <div className="space-y-8 p-8">
      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>GDG brand colors and theme colors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-gdg-blue rounded-lg"></div>
              <p className="text-sm font-medium">GDG Blue</p>
              <p className="text-xs text-muted-foreground">--gdg-blue</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-gdg-red rounded-lg"></div>
              <p className="text-sm font-medium">GDG Red</p>
              <p className="text-xs text-muted-foreground">--gdg-red</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-gdg-yellow rounded-lg"></div>
              <p className="text-sm font-medium">GDG Yellow</p>
              <p className="text-xs text-muted-foreground">--gdg-yellow</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-gdg-green rounded-lg"></div>
              <p className="text-sm font-medium">GDG Green</p>
              <p className="text-xs text-muted-foreground">--gdg-green</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Font families and text styles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="font-display text-4xl font-bold">Display Font (Space Grotesk)</h1>
            <p className="text-sm text-muted-foreground">Used for headings and display text</p>
          </div>
          <div>
            <p className="font-body text-lg">Body Font (Inter)</p>
            <p className="text-sm text-muted-foreground">Used for body text and UI elements</p>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>Consistent button styling across the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <AdminButton variant="success">Success</AdminButton>
            <AdminButton variant="warning">Warning</AdminButton>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status indicators and labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Card Components</CardTitle>
          <CardDescription>Container components with consistent styling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Card</CardTitle>
                <CardDescription>This is a sample card description</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Card content goes here with consistent padding and styling.</p>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Highlighted Card</CardTitle>
                <CardDescription>Card with primary border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This card uses the primary color for emphasis.</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignSystemShowcase;