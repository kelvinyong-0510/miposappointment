from PIL import Image

def process_pos(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.load()
    width, height = img.size
    
    # Remove SUNMI logo from top right
    for x in range(width):
        for y in range(int(height * 0.35)): 
            r, g, b, a = datas[x, y]
            # Detect orange pixels for SUNMI logo
            if r > 150 and g < 200 and b < 100 and a > 0:
                datas[x, y] = (0, 0, 0, 0)
                
    # Upscale to 4K using LANCZOS
    new_size = (4096, 4096)
    img = img.resize(new_size, Image.LANCZOS)
    img.save(output_path, "PNG")

def process_queue(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    new_size = (4096, 4096)
    img = img.resize(new_size, Image.LANCZOS)
    img.save(output_path, "PNG")

if __name__ == '__main__':
    process_pos("public/products/pos_trans.png", "public/products/pos_4k.png")
    process_queue("public/products/queue_trans.png", "public/products/queue_4k.png")
