import { useState } from "react";
import { Controller } from "react-hook-form";
import { APPAREL_SIZES, UK_SHOE_SIZES } from "./presets";

const SizeSelector = ({ control, errors }: any) => {
  const [customDraft, setCustomDraft] = useState("");

  const parseCustomSizes = (raw: string): string[] => {
    return raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  return (
    <div className="mt-2">
      <label className="block font-semibold text-gray-300 mb-1">Sizes</label>
      <p className="text-xs text-gray-500 mb-2">
        Clothing sizes, UK shoe sizes, or add your own (e.g. UK 6.5, Wide fit).
      </p>
      <Controller
        name="sizes"
        control={control}
        render={({ field }) => {
          const selected: string[] = field.value || [];

          const toggle = (size: string) => {
            const isSelected = selected.includes(size);
            field.onChange(
              isSelected
                ? selected.filter((s: string) => s !== size)
                : [...selected, size],
            );
          };

          return (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                  Apparel
                </p>
                <div className="flex gap-2 flex-wrap">
                  {APPAREL_SIZES.map((size) => {
                    const isSelected = selected.includes(size);
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => toggle(size)}
                        className={`px-3 py-1 rounded-lg font-Poppins transition-colors ${
                          isSelected
                            ? "bg-gray-700 text-white border border-[#ffffff6b]"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                  UK shoes
                </p>
                <div className="flex gap-2 flex-wrap">
                  {UK_SHOE_SIZES.map((size) => {
                    const isSelected = selected.includes(size);
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => toggle(size)}
                        className={`px-3 py-1 rounded-lg font-Poppins transition-colors ${
                          isSelected
                            ? "bg-gray-700 text-white border border-[#ffffff6b]"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                  Custom sizes
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    type="text"
                    value={customDraft}
                    onChange={(e) => setCustomDraft(e.target.value)}
                    placeholder="e.g. UK 9, EU 42, Half pair…"
                    className="flex-1 border border-gray-700 bg-transparent p-2 rounded-md text-white text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const extras = parseCustomSizes(customDraft);
                      if (extras.length === 0) return;
                      const merged = [...new Set([...selected, ...extras])];
                      field.onChange(merged);
                      setCustomDraft("");
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white whitespace-nowrap"
                  >
                    Add sizes
                  </button>
                </div>
              </div>

              {selected.length > 0 && (
                <p className="text-xs text-gray-400">
                  Selected ({selected.length}):{" "}
                  <span className="text-gray-300">{selected.join(", ")}</span>
                </p>
              )}
            </div>
          );
        }}
      />
      {errors.sizes && (
        <p className="text-red-500 text-xs mt-1">
          {errors.sizes.message as string}
        </p>
      )}
    </div>
  );
};

export default SizeSelector;
