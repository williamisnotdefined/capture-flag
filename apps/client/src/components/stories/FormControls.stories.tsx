import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectInput, TextInput, TextareaInput } from "../FormControls";

const meta = {
  component: TextInput,
  title: "Components/FormControls",
} satisfies Meta<typeof TextInput>;

export default meta;

export const Text: StoryObj<typeof TextInput> = {
  args: {
    placeholder: "newCheckout",
  },
  render: (args) => <TextInput {...args} />,
};

export const InvalidText: StoryObj<typeof TextInput> = {
  args: {
    "aria-invalid": true,
    defaultValue: "invalid key!",
  },
  render: (args) => <TextInput {...args} />,
};

export const Select: StoryObj<typeof SelectInput> = {
  render: (args) => (
    <SelectInput {...args}>
      <option value="production">Production</option>
      <option value="staging">Staging</option>
      <option value="development">Development</option>
    </SelectInput>
  ),
};

export const Textarea: StoryObj<typeof TextareaInput> = {
  args: {
    defaultValue: JSON.stringify({ enabled: true }, null, 2),
    rows: 5,
  },
  render: (args) => <TextareaInput className="font-mono" {...args} />,
};
