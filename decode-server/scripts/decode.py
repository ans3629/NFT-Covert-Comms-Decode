import hashlib
import random
import sys
from PIL import Image

#Create seed from signature (Hash signature)
def seed(signature: str) -> int:
    hash = hashlib.sha256(signature.encode()).digest()
    return int.from_bytes(hash, byteorder="big")


#Shuffle the order
def generate_chain(rng, width, height, length):
    total = width * height
    indices = list(range(total))
    rng.shuffle(indices)
    coords = [(i % width, i // width) for i in indices[:length]]
    return coords


#Same as the encoding script up to here because we had to determine
# what the shuffled order is in order to decode it

#Pull the least significant bit from each of the encoded pixels 
#cycles through red, green, and blue
#only red encoding is commented out

def pull_bits(image, chain):
    """pixels = image.load()
    bits = []
    for (x, y) in chain:
        r, g, b = pixels[x, y]
        bit = r & 1
        bits.append(bit)
    return bits"""
    pixels = image.load()
    bits = []
    for i, (x, y) in enumerate(chain):
        r, g, b = pixels[x, y]
        if i % 3 == 0:
            bit = r & 1
        elif i % 3 == 1:
            bit = g & 1
        else:
            bit = b & 1
        bits.append(bit)
    return bits


#Used for determining how long the message is, converts the bits to ints
def convert_to_int(bits):
    val = 0
    for b in bits:
        val = (val << 1) | b
    return val

#Take the bits pulled and reconstruct the message 
def convert_to_text(bits):
    out = bytearray()
    for i in range(0, len(bits), 8):
        byte = bits[i:i+8]
        val = 0
        for b in byte:
            val = (val << 1) | b
        out.append(val)
    return bytes(out)

def main():
    signature = sys.argv[1]
    image_path = sys.argv[2]
    seed_val = seed(signature)
    rng = random.Random(seed_val)

    img = Image.open(image_path).convert("RGB")
    width, height = img.size

    #determine message length
    temp_chain = generate_chain(rng, width, height, 32)
    temp_bits = pull_bits(img, temp_chain)
    msg_len = convert_to_int(temp_bits)

    #create chain and pull modified bits
    total_bits = 32 + msg_len * 8
    rng = random.Random(seed_val)  # reset RNG to start
    full_chain = generate_chain(rng, width, height, total_bits)
    full_bits = pull_bits(img, full_chain)

    #find header and message
    header_bits = full_bits[:32]
    message_bits = full_bits[32:]

    #convert message back to text
    message = convert_to_text(message_bits).decode("utf-8", errors="replace")
    print(message)



if __name__ == "__main__":
    main()

