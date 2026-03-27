import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@superset/ui/context-menu";
import { cn } from "@superset/ui/utils";
import { useId, useRef } from "react";
import { HiCheck } from "react-icons/hi2";
import { LuPalette } from "react-icons/lu";
import {
	isProjectHexColor,
	isProjectPresetColor,
	normalizeProjectColorValue,
	PROJECT_COLOR_DEFAULT,
	PROJECT_COLORS,
	PROJECT_CUSTOM_COLORS,
} from "shared/constants/project-colors";

type ColorSelectorVariant = "inline" | "menu";

interface ColorSelectorProps {
	selectedColor?: string | null;
	onSelectColor: (color: string) => void;
	variant?: ColorSelectorVariant;
	className?: string;
}

const CUSTOM_COLOR_FALLBACK = PROJECT_CUSTOM_COLORS[0]?.value ?? "#3b82f6";

function renderColorSwatch(colorValue: string, variant: ColorSelectorVariant) {
	const isDefault = colorValue === PROJECT_COLOR_DEFAULT;

	return (
		<span
			className={cn(
				"relative inline-flex shrink-0 items-center justify-center rounded-full border",
				variant === "inline" ? "size-5" : "size-3.5",
				isDefault ? "border-border bg-background" : "border-border/50",
			)}
			style={isDefault ? undefined : { backgroundColor: colorValue }}
		>
			{isDefault ? (
				<span
					className={cn(
						"rounded-full bg-muted-foreground/35",
						variant === "inline" ? "size-2.5" : "size-1.5",
					)}
				/>
			) : null}
		</span>
	);
}

export function ColorSelector({
	selectedColor,
	onSelectColor,
	variant = "inline",
	className,
}: ColorSelectorProps) {
	const colorInputId = useId();
	const colorInputRef = useRef<HTMLInputElement>(null);
	const selectedValue = normalizeProjectColorValue(
		selectedColor ?? PROJECT_COLOR_DEFAULT,
	);
	const hasCustomSelection =
		isProjectHexColor(selectedValue) && !isProjectPresetColor(selectedValue);
	const colorInputValue = isProjectHexColor(selectedValue)
		? selectedValue
		: CUSTOM_COLOR_FALLBACK;

	const openColorPicker = () => {
		const input = colorInputRef.current;

		if (!input) {
			return;
		}

		try {
			input.showPicker?.();
			return;
		} catch {
			// Fall back to click() when showPicker is unsupported or blocked.
		}

		try {
			input.click();
		} catch {
			// Ignore if the browser refuses to open the native picker.
		}
	};

	const handleCustomColorChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		onSelectColor(normalizeProjectColorValue(event.target.value));
	};

	if (variant === "menu") {
		return (
			<>
				{PROJECT_COLORS.map((color) => {
					const isSelected = selectedValue === color.value;

					return (
						<ContextMenuItem
							key={color.value}
							onSelect={() => onSelectColor(color.value)}
							className="flex items-center gap-2"
						>
							{renderColorSwatch(color.value, variant)}
							<span>{color.name}</span>
							{isSelected ? (
								<HiCheck className="ml-auto size-3.5 text-muted-foreground" />
							) : null}
						</ContextMenuItem>
					);
				})}
				<ContextMenuSeparator />
				<ContextMenuItem
					onSelect={(event) => {
						event.preventDefault();
						openColorPicker();
					}}
					className="flex items-center gap-2"
				>
					{renderColorSwatch(colorInputValue, variant)}
					<span>Custom...</span>
					{hasCustomSelection ? (
						<HiCheck className="ml-auto size-3.5 text-muted-foreground" />
					) : null}
				</ContextMenuItem>
				<input
					id={colorInputId}
					ref={colorInputRef}
					type="color"
					value={colorInputValue}
					onChange={handleCustomColorChange}
					tabIndex={-1}
					aria-hidden="true"
					className="sr-only"
				/>
			</>
		);
	}

	return (
		<div className={cn("flex flex-wrap items-center gap-2", className)}>
			{PROJECT_COLORS.map((color) => {
				const isSelected = selectedValue === color.value;

				return (
					<button
						key={color.value}
						type="button"
						title={color.name}
						aria-label={`Set color to ${color.name}`}
						aria-pressed={isSelected}
						onClick={() => onSelectColor(color.value)}
						className={cn(
							"flex size-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
							isSelected ? "scale-110 border-foreground" : "border-transparent",
						)}
					>
						{renderColorSwatch(color.value, variant)}
					</button>
				);
			})}
			<label
				htmlFor={colorInputId}
				title="Choose custom color"
				className={cn(
					"relative flex size-7 cursor-pointer items-center justify-center rounded-full border-2 transition-transform hover:scale-110",
					"focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
					hasCustomSelection
						? "scale-110 border-foreground"
						: "border-transparent",
				)}
			>
				{renderColorSwatch(colorInputValue, variant)}
				<span className="pointer-events-none absolute -bottom-1 -right-1 flex size-3 items-center justify-center rounded-full border bg-background text-muted-foreground">
					<LuPalette className="size-2" />
				</span>
				<input
					id={colorInputId}
					type="color"
					value={colorInputValue}
					onChange={handleCustomColorChange}
					aria-label="Choose custom color"
					className="absolute inset-0 cursor-pointer opacity-0"
				/>
			</label>
		</div>
	);
}
