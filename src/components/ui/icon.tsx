import Ionicons from "@react-native-vector-icons/ionicons";
import { View } from "react-native";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface IconProps {
  name: IoniconName;
  size?: number;
  color?: string;
}

export const Icon = ({ name, size = 20, color = "#999" }: IconProps) => {
  return (
    <View>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
};
