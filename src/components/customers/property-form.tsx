"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema, type PropertyFormData } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface PropertyFormProps {
  defaultValues?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

const PROPERTY_TYPES = [
  "Detached House",
  "Semi-Detached House",
  "Terraced House",
  "Flat / Apartment",
  "Bungalow",
  "Commercial Office",
  "Commercial Retail",
  "Other",
];

const CARPET_TYPES = [
  "Cut Pile",
  "Loop Pile",
  "Berber",
  "Frieze",
  "Saxony",
  "Plush",
  "Commercial Grade",
  "Other",
];

export function PropertyForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save Property",
}: PropertyFormProps) {
  const [carpetInput, setCarpetInput] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      address: "",
      city: "",
      postcode: "",
      propertyType: "",
      rooms: undefined,
      sqFootage: undefined,
      carpetTypes: [],
      accessNotes: "",
      ...defaultValues,
    },
  });

  const carpetTypes = watch("carpetTypes") || [];

  const addCarpetType = (type: string) => {
    if (type && !carpetTypes.includes(type)) {
      setValue("carpetTypes", [...carpetTypes, type]);
    }
    setCarpetInput("");
  };

  const removeCarpetType = (type: string) => {
    setValue(
      "carpetTypes",
      carpetTypes.filter((t) => t !== type)
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prop-address">Street Address *</Label>
        <Input
          id="prop-address"
          {...register("address")}
          placeholder="123 High Street"
        />
        {errors.address && (
          <p className="text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prop-city">City *</Label>
          <Input
            id="prop-city"
            {...register("city")}
            placeholder="London"
          />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="prop-postcode">Postcode *</Label>
          <Input
            id="prop-postcode"
            {...register("postcode")}
            placeholder="SW1A 1AA"
          />
          {errors.postcode && (
            <p className="text-sm text-red-500">{errors.postcode.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="prop-type">Property Type</Label>
          <Select id="prop-type" {...register("propertyType")}>
            <option value="">Select type</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prop-rooms">Rooms</Label>
          <Input
            id="prop-rooms"
            type="number"
            min="1"
            {...register("rooms")}
            placeholder="e.g. 4"
          />
          {errors.rooms && (
            <p className="text-sm text-red-500">{errors.rooms.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="prop-sqft">Sq. Footage</Label>
          <Input
            id="prop-sqft"
            type="number"
            min="1"
            {...register("sqFootage")}
            placeholder="e.g. 1200"
          />
          {errors.sqFootage && (
            <p className="text-sm text-red-500">{errors.sqFootage.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Carpet Types</Label>
        <div className="flex gap-2">
          <Select
            value={carpetInput}
            onChange={(e) => {
              if (e.target.value) {
                addCarpetType(e.target.value);
              }
            }}
          >
            <option value="">Add carpet type</option>
            {CARPET_TYPES.filter((t) => !carpetTypes.includes(t)).map(
              (type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              )
            )}
          </Select>
        </div>
        {carpetTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {carpetTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
              >
                {type}
                <button
                  type="button"
                  onClick={() => removeCarpetType(type)}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="prop-access">Access Notes</Label>
        <Textarea
          id="prop-access"
          {...register("accessNotes")}
          placeholder="e.g. Key under mat, side gate code 1234"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
