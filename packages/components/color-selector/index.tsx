import { useState } from "react";
import { Controller } from "react-hook-form";
import { Plus } from "lucide-react";
import { PRESET_COLORS } from "./presets";

const ColorSelector = ({ control, errors }: any) => {
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColor, setNewColor] = useState("#ffffff");

  return (
    <div className="mt-2">
      <label className="block font-semibold text-gray-300 mb-1">Colors</label>
      <p className="text-xs text-gray-500 mb-2">
        Pick preset colours or add any custom hex. Stored values are hex codes (e.g.
        #000000).
      </p>
      <Controller
        name="colors"
        control={control}
        render={({ field }) => (
          <div className="flex gap-3 flex-wrap items-center">
            {[
              ...new Set([
                ...PRESET_COLORS.map((p) => p.hex),
                ...customColors,
              ]),
            ].map((color) => {
              const preset = PRESET_COLORS.find((p) => p.hex === color);
              const isSelected = (field.value || []).includes(color);
              const isLightColor = ["#ffffff", "#ffff00"].includes(color);

              return (
                <button
                  type="button"
                  key={color}
                  title={preset?.label ?? color}
                  aria-label={preset?.label ?? color}
                  onClick={() =>
                    field.onChange(
                      isSelected
                        ? field.value.filter((c: string) => c !== color)
                        : [...(field.value || []), color],
                    )
                  }
                  className={`w-7 h-7 p-2 rounded-md my-1 flex items-center justify-center border-2 transition ${
                    isSelected ? "scale-110 border-white" : "border-transparent"
                  } ${isLightColor ? "border-gray-600" : ""}`}
                  style={{ backgroundColor: color }}
                />
              );
            })}

            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-500 bg-gray-800 hover:bg-gray-700 transition"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Add custom colour"
            >
              <Plus size={16} color="white" />
            </button>

            {showColorPicker && (
              <div className="relative flex items-center gap-2 flex-wrap">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-10 p-0 border-none cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    const normalized = newColor.toLowerCase();
                    if (!(field.value || []).includes(normalized)) {
                      field.onChange([...(field.value || []), normalized]);
                    }
                    setCustomColors((prev) =>
                      prev.includes(normalized) ? prev : [...prev, normalized],
                    );
                    setShowColorPicker(false);
                  }}
                  className="px-3 py-1 bg-gray-700 text-white rounded-md text-sm"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default ColorSelector;
