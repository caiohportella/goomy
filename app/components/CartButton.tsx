import { images } from "@/constants";
import { View, Text, TouchableOpacity, Image } from "react-native";
const CartButton = () => {
  const totalItemCount = 10;

  return (
    <TouchableOpacity className="cart-btn" onPress={() => {}}>
      <Image source={images.bag} className="size-5" resizeMode="contain" />

      {totalItemCount > 0 && (
        <View className="cart-badge">
          <Text className="small-bold text-white">{totalItemCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
export default CartButton;
