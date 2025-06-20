import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  generateFavicon,
  generatePWAIcons,
  optimizeImage,
} from "../utils/imageOptimization";

type OptimizedFile = {
  original: File;
  optimized: File;
  previewUrl: string;
  optimizedPreviewUrl: string | null;
  reductionPercent: number;
  extraPreviews?: {
    name: string;
    url: string;
    type: "icon" | "splash";
  }[];
};

export default function ImageOptimizer() {
  const [files, setFiles] = useState<OptimizedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"optimize" | "favicon" | "pwa">("optimize");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputFiles, setInputFiles] = useState<File[]>([]);

  const [options, setOptions] = useState({
    format: "webp" as "webp" | "jpeg" | "png" | "original",
    quality: 80,
    maxWidth: 0,
    maxHeight: 0,
  });

  const [faviconOptions, setFaviconOptions] = useState({
    sizes: [16, 32, 48],
    outputFormat: "ico" as "ico" | "png",
  });

  const [pwaOptions, setPwaOptions] = useState({
    iconSizes: [192, 512],
    splashSizes: [
      { width: 640, height: 1136 },
      { width: 750, height: 1334 },
      { width: 828, height: 1792 },
    ],
    backgroundColor: "#ffffff",
  });

  const processFiles = async (inputFiles: File[]) => {
    setIsProcessing(true);
    const newFiles: OptimizedFile[] = [];

    for (const file of inputFiles) {
      if (!file.type.startsWith("image/")) continue;

      try {
        let optimizedFile;
        if (activeTab === "favicon") {
          optimizedFile = await generateFavicon(file, faviconOptions);
        } else if (activeTab === "pwa") {
          const { zip, previews } = await generatePWAIcons(file, pwaOptions);
          optimizedFile = zip;

          const extraPreviews = previews.map(
            (preview: { name: string; url: string; type: "icon" | "splash" }) => ({
              name: preview.name,
              url: preview.url,
              type: preview.type,
            })
          );

          newFiles.push({
            original: file,
            optimized: zip,
            previewUrl: URL.createObjectURL(file),
            optimizedPreviewUrl: null,
            reductionPercent: 0,
            extraPreviews,
          });

          continue;
        } else {
          optimizedFile = await optimizeImage(file, options);
        }

        const previewUrl = URL.createObjectURL(file);
        const optimizedPreviewUrl = URL.createObjectURL(optimizedFile);
        const reductionPercent =
          ((file.size - optimizedFile.size) / file.size) * 100;

        newFiles.push({
          original: file,
          optimized: optimizedFile,
          previewUrl,
          optimizedPreviewUrl,
          reductionPercent,
        });
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }

    setFiles(newFiles);
    setIsProcessing(false);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFiles = Array.from(e.target.files);
    setInputFiles(selectedFiles);
    processFiles(selectedFiles);
  };

  useEffect(() => {
    if (inputFiles.length > 0) {
      processFiles(inputFiles);
    }
  }, [options, faviconOptions, pwaOptions, activeTab]);

  const handleDownload = (file: OptimizedFile) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file.optimized);
    link.download = file.optimized.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemove = (index: number) => {
    const newFiles = [...files];
    URL.revokeObjectURL(newFiles[index].previewUrl);
    if (newFiles[index].optimizedPreviewUrl)
      URL.revokeObjectURL(newFiles[index].optimizedPreviewUrl);
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto min-h-[calc(100vh-3rem)] max-w-6xl rounded-lg bg-white p-6 shadow-md"
      >
        <motion.h1
          className="mb-6 text-2xl font-bold text-gray-800"
          whileHover={{ scale: 1.02 }}
        >
          Image Optimizer Pro
        </motion.h1>

        {/* Navigation Tabs */}
        <div className="mb-6 flex border-b border-gray-200">
          {(["optimize", "favicon", "pwa"] as const).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 font-medium ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "optimize" && "Image Optimization"}
              {tab === "favicon" && "Favicon Generator"}
              {tab === "pwa" && "PWA Assets"}
            </button>
          ))}
        </div>

        {/* Options Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="mb-6 rounded-lg bg-gray-50 p-4"
          >
            {activeTab === "optimize" && (
              <>
                <h2 className="mb-4 text-lg font-semibold">
                  Optimization Options
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Output Format
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={options.format}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          format: e.target.value as any,
                        })
                      }
                    >
                      <option value="webp">WebP</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="original">Original Format</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Quality: {options.quality}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={options.quality}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          quality: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Max Width (px)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={options.maxWidth}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          maxWidth: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 p-2"
                      placeholder="0 for no limit"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Max Height (px)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={options.maxHeight}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          maxHeight: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 p-2"
                      placeholder="0 for no limit"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "favicon" && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Favicon Options</h2>
                <small className="mb-2 text-sm text-gray-600">
                  Note: Only the largest selected size will be generated..
                </small>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Sizes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[16, 32, 48, 64, 128].map((size) => (
                        <label
                          key={size}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={faviconOptions.sizes.includes(size)}
                            onChange={() => {
                              setFaviconOptions((prev) => {
                                const newSizes = prev.sizes.includes(size)
                                  ? prev.sizes.filter((s) => s !== size)
                                  : [...prev.sizes, size];
                                return { ...prev, sizes: newSizes };
                              });
                            }}
                          />
                          <span>
                            {size}x{size}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Output Format
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={faviconOptions.outputFormat}
                      onChange={(e) =>
                        setFaviconOptions({
                          ...faviconOptions,
                          outputFormat: e.target.value as any,
                        })
                      }
                    >
                      <option value="ico">ICO (Windows)</option>
                      <option value="png">PNG (Modern Browsers)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === "pwa" && (
              <>
                <h2 className="mb-4 text-lg font-semibold">
                  PWA Assets Options
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Icon Sizes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[192, 256, 512].map((size) => (
                        <label
                          key={size}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={pwaOptions.iconSizes.includes(size)}
                            onChange={() => {
                              setPwaOptions((prev) => {
                                const newSizes = prev.iconSizes.includes(size)
                                  ? prev.iconSizes.filter((s) => s !== size)
                                  : [...prev.iconSizes, size];
                                return { ...prev, iconSizes: newSizes };
                              });
                            }}
                          />
                          <span>
                            {size}x{size}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Splash Screen Sizes
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={pwaOptions.splashSizes.length}
                      onChange={(e) => {
                        const count = parseInt(e.target.value);
                        const defaultSizes = [
                          { width: 640, height: 1136 },
                          { width: 750, height: 1334 },
                          { width: 828, height: 1792 },
                          { width: 1242, height: 2208 },
                          { width: 1125, height: 2436 },
                        ].slice(0, count);
                        setPwaOptions({
                          ...pwaOptions,
                          splashSizes: defaultSizes,
                        });
                      }}
                    >
                      <option value="0">None</option>
                      <option value="2">2 Sizes</option>
                      <option value="3">3 Sizes</option>
                      <option value="5">5 Sizes</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Splash Image Background Color
                    </label>
                    <input
                      type="color"
                      value={pwaOptions.backgroundColor}
                      onChange={(e) =>
                        setPwaOptions({
                          ...pwaOptions,
                          backgroundColor: e.target.value,
                        })
                      }
                      className="h-10 w-full"
                    />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          multiple={activeTab === "optimize"}
        />

        <motion.button
          onClick={triggerFileInput}
          disabled={isProcessing}
          whileHover={{ scale: isProcessing ? 1 : 1.05 }}
          whileTap={{ scale: isProcessing ? 1 : 0.95 }}
          className={`mb-6 w-full rounded-md px-4 py-3 font-medium ${isProcessing ? "cursor-not-allowed bg-gray-400" : "bg-blue-600 text-white hover:bg-blue-700"}`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mr-2 inline-block"
              >
                ⏳
              </motion.span>
              Processing...
            </span>
          ) : activeTab === "optimize" ? (
            "Select Images"
          ) : activeTab === "favicon" ? (
            "Select Favicon Source"
          ) : (
            "Select PWA Icon Source"
          )}
        </motion.button>

        {/* Results */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <h2 className="mb-4 text-lg font-semibold">
              {activeTab === "optimize" && "Optimized Images"}
              {activeTab === "favicon" && "Generated Favicons"}
              {activeTab === "pwa" && "Generated PWA Assets"}
            </h2>

            <AnimatePresence>
              {files.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  layout
                  className="mb-4 rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="truncate font-medium text-gray-800">
                      {file.original.name}
                    </h3>
                    <motion.button
                      onClick={() => handleRemove(index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </motion.button>
                  </div>

                  <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-sm text-gray-600">
                        Original: {(file.original.size / 1024).toFixed(2)} KB
                      </p>
                      {file.previewUrl && (
                        <img
                          src={file.previewUrl}
                          alt="Original"
                          className="h-auto w-full rounded border border-gray-200"
                        />
                      )}
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-gray-600">
                        {activeTab === "optimize" &&
                          `Optimized: ${(file.optimized.size / 1024).toFixed(2)} KB (${file.reductionPercent.toFixed(1)}% smaller)`}
                        {activeTab === "favicon" &&
                          `Generated Favicon: ${(file.optimized.size / 1024).toFixed(2)} KB`}
                        {activeTab === "pwa" && file.extraPreviews && (
                          <div className="grid grid-cols-2 gap-4">
                            {file.extraPreviews.map((asset) => (
                              <div key={asset.name}>
                                <div className="mb-1 text-sm text-gray-600">
                                  {asset.type.toUpperCase()}: {asset.name}
                                </div>
                                <img
                                  src={asset.url}
                                  alt={asset.name}
                                  className="w-full rounded border border-gray-200"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {file.previewUrl && file.optimizedPreviewUrl && (
                        <img
                          src={file.optimizedPreviewUrl}
                          alt="Optimized"
                          className="h-auto w-full rounded border border-gray-200"
                        />
                      )}
                    </div>
                  </div>

                  <motion.button
                    onClick={() => handleDownload(file)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
                  >
                    Download{" "}
                    {activeTab === "favicon"
                      ? "Favicon"
                      : activeTab === "pwa"
                        ? "PWA Assets"
                        : "Optimized"}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="mt-4 text-sm text-gray-600">
              <p>Total files: {files.length}</p>
              {activeTab === "optimize" && (
                <p>
                  Total reduction:{" "}
                  {(
                    (files.reduce(
                      (sum, file) =>
                        sum + file.original.size - file.optimized.size,
                      0,
                    ) /
                      files.reduce(
                        (sum, file) => sum + file.original.size,
                        0,
                      )) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
