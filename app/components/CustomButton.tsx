import { CustomButtonProps } from "@/type";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import cn from "clsx";

const CustomButton = ({
  onPress,
  title = "Click me",
  style,
  textStyle,
  leftIcon,
  isLoading = false,
}: CustomButtonProps) => {
  return (
    <TouchableOpacity className={cn("custom-btn", style)} onPress={onPress}>
      {leftIcon}

      <View className="flex-center flex-row">
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text
            className={cn("text-white-100 paragragh-semibold", textStyle)}
          >
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
export default CustomButton;
