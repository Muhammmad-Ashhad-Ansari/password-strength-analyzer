from flask import Flask, render_template, request, jsonify
import re
import math
import hashlib
import secrets
import string

app = Flask(__name__)

# A sample of very common / breached passwords for demo purposes.
# In a real deployment you'd check against a much larger leaked-password list.
COMMON_PASSWORDS = {
    "password", "password1", "password123", "password1234", "passw0rd", "pass",
    "123456", "1234567", "12345678", "123456789", "1234567890", "12345678901",
    "12345", "1234", "123123", "123321", "654321", "111111", "222222", "333333",
    "000000", "112233", "121212", "696969", "666666", "777777", "888888", "999999",
    "qwerty", "qwerty123", "qwertyuiop", "qwe123", "asdfgh", "asdfghjkl", "zxcvbn",
    "zxcvbnm", "123qwe", "qazwsx", "1qaz2wsx", "1q2w3e4r", "abc123", "abcdef",
    "admin", "administrator", "root", "toor", "guest", "user", "test", "test123",
    "letmein", "letmein1", "welcome", "welcome1", "monkey", "monkey123", "dragon",
    "dragon123", "master", "master123", "login", "login123", "princess",
    "football", "soccer", "baseball", "basketball", "iloveyou", "lovely",
    "sunshine", "sunset", "trustno1", "secret", "secret123", "hello", "hello123",
    "computer", "whatever", "freedom", "ninja", "shadow", "shadow123", "superman",
    "batman", "starwars", "pokemon", "mickey", "killer", "hunter", "harley",
    "flower", "pepper", "cookie", "cheese", "ginger", "matrix", "mustang",
    "peanut", "summer", "winter", "autumn", "spring", "charlie", "daniel",
    "andrew", "thomas", "joshua", "michael", "robert", "jordan", "jessica",
    "ashley", "hannah", "phoenix", "tigger", "bubble", "purple", "orange",
    "blue", "green", "red", "yellow", "silver", "gold",
}

SEQUENTIAL_PATTERNS = [
    "0123456789", "9876543210",
    "abcdefghijklmnopqrstuvwxyz",
    "zyxwvutsrqponmlkjihgfedcba",
    "qwertyuiop", "asdfghjkl", "zxcvbnm"
]

KEYBOARD_PATTERNS = [
    "qwertyuiop", "asdfghjkl", "zxcvbnm",
    "poiuytrewq", "lkjhgfdsa", "mnbvcxz",
    "1qaz", "2wsx", "3edc", "4rfv", "5tgb", "6yhn", "7ujm", "8ik,", "9ol.", "0p;/",
    "zaq1", "xsw2", "cde3", "vfr4", "bgt5", "nhy6", "mju7", ",ki8", ".lo9", "/;p0",
]

AMBIGUOUS_CHARS = set("Il1O0o`'\"|:;,.<>?/\\~")

PASSPHRASE_WORDS = [
    "acorn", "aero", "alpine", "amber", "amethyst", "anchor", "apricot",
    "aqua", "arcade", "arctic", "arena", "arrow", "aspen", "atlas", "aurora",
    "autumn", "azure", "bamboo", "basalt", "bayou", "beacon", "birch",
    "bison", "blaze", "bloom", "blossom", "bonfire", "bonsai", "breeze",
    "briar", "brick", "bright", "cactus", "canyon", "carbon", "cascade",
    "cedar", "chalice", "charcoal", "cherry", "cinder", "cirrus", "clover",
    "cobalt", "comet", "copper", "coral", "cosmos", "cotton", "crest",
    "crimson", "crystal", "cypress", "dawn", "delta", "denim", "desert",
    "diorite", "dune", "dusk", "echo", "eclipse", "ember", "emerald",
    "falcon", "feather", "fern", "fjord", "flint", "foam", "forest", "fossil",
    "foxglove", "frost", "galaxy", "gale", "garnet", "geode", "glacier",
    "glade", "glass", "gleam", "goldfinch", "granite", "gravel", "grove",
    "gull", "harbor", "haze", "hazel", "heather", "heron", "hickory",
    "hilltop", "horizon", "hyacinth", "ibis", "icicle", "indigo", "iris",
    "island", "ivy", "jade", "jasmine", "juniper", "kelp", "kestrel",
    "kingfisher", "lagoon", "lantern", "lapis", "lava", "lemon", "lichen",
    "lilac", "linden", "lodge", "lotus", "lumen", "lychee", "magma",
    "magnolia", "maple", "marble", "marsh", "meadow", "melody", "mesa",
    "meteor", "mica", "mist", "monsoon", "moss", "mountain", "mulberry",
    "nebula", "nectar", "neon", "nickel", "nightshade", "noon", "north",
    "nova", "oasis", "ocean", "olive", "onyx", "opal", "orbit", "orchid",
    "osprey", "otter", "owl", "oxbow", "palm", "panda", "papaya", "paradise",
    "peacock", "pearl", "pecan", "pelican", "petal", "phantom", "phoenix",
    "pine", "plum", "pond", "poplar", "poppy", "prism", "puma", "pyrite",
    "quartz", "quail", "queen", "quill", "raccoon", "rainbow", "raven",
    "reef", "ridge", "rill", "river", "robin", "rose", "ruby", "runner",
    "sable", "safari", "salmon", "sand", "sapphire", "satin", "savanna",
    "scarlet", "sea", "serene", "shadow", "shale", "shell", "shoal", "silk",
    "silver", "slate", "smoke", "snow", "solstice", "sparrow", "spire",
    "spruce", "starling", "stone", "storm", "summit", "sunbird", "sunrise",
    "sunset", "swan", "talon", "tangerine", "temple", "thistle", "tide",
    "timber", "topaz", "torch", "tornado", "trail", "trellis", "trident",
    "tundra", "turtle", "valley", "vapor", "veil", "velvet", "verdant",
    "vertex", "vista", "volcano", "willow", "winter", "wolf", "zephyr",
]

MAX_POINTS = 8


def has_sequential_chars(password, run_length=4):
    """Detects runs like '1234', 'abcd', 'qwerty' of a given length."""
    pw_lower = password.lower()
    for pattern in SEQUENTIAL_PATTERNS:
        for i in range(len(pattern) - run_length + 1):
            if pattern[i:i + run_length] in pw_lower:
                return True
    return False


def has_keyboard_pattern(password, run_length=4):
    """Detects keyboard walks like '1qaz', 'qwer', 'zaq1'."""
    pw_lower = password.lower()
    for pattern in KEYBOARD_PATTERNS:
        for i in range(len(pattern) - run_length + 1):
            if pattern[i:i + run_length] in pw_lower:
                return True
    return False


def has_repeated_chars(password, run_length=3):
    """Detects repeated characters like 'aaaa' or '1111'."""
    for i in range(len(password) - run_length + 1):
        if len(set(password[i:i + run_length])) == 1:
            return True
    return False


def has_obvious_date(password):
    """Detects birth years (1950-2029) or dd/mm/yyyy style dates."""
    if re.search(r'19[5-9]\d|20[0-2]\d', password):
        return True
    if re.search(r'\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}', password):
        return True
    return False


def calculate_entropy(password):
    """Rough Shannon-style entropy estimate based on character pool size."""
    pool = 0
    if re.search(r'[a-z]', password):
        pool += 26
    if re.search(r'[A-Z]', password):
        pool += 26
    if re.search(r'[0-9]', password):
        pool += 10
    if re.search(r'[^a-zA-Z0-9]', password):
        pool += 32
    if pool == 0:
        return 0
    entropy = len(password) * math.log2(pool)
    return round(entropy, 2)


def estimate_crack_time(entropy_bits):
    """Very rough offline brute-force estimate assuming 1e10 guesses/sec."""
    guesses_per_second = 1e10
    total_combinations = 2 ** entropy_bits
    seconds = total_combinations / (2 * guesses_per_second)  # average case

    minute, hour, day = 60, 3600, 86400
    month, year, decade, century = day * 30, day * 365, day * 365 * 10, day * 365 * 100

    if seconds < 1:
        return "Instantly"
    if seconds < minute:
        return f"{seconds:.0f} seconds"
    if seconds < hour:
        return f"{seconds / minute:.0f} minutes"
    if seconds < day:
        return f"{seconds / hour:.1f} hours"
    if seconds < month:
        return f"{seconds / day:.1f} days"
    if seconds < year:
        return f"{seconds / month:.1f} months"
    if seconds < decade:
        return f"{seconds / year:.1f} years"
    if seconds < century:
        return f"{seconds / decade:.1f} decades"
    return "Centuries"


def password_fingerprint(password):
    """Short visual SHA-256 fingerprint of the password."""
    if not password:
        return ""
    h = hashlib.sha256(password.encode()).hexdigest()
    return " ".join(h[i:i + 4] for i in range(0, 24, 4)) + "  …"


def char_composition(password):
    return {
        "uppercase": len(re.findall(r'[A-Z]', password)),
        "lowercase": len(re.findall(r'[a-z]', password)),
        "digits": len(re.findall(r'[0-9]', password)),
        "special": len(re.findall(r'[^a-zA-Z0-9]', password)),
    }


def analyze_password(password):
    if not password:
        return {
            "score": 0,
            "label": "No Password",
            "entropy": 0,
            "crack_time": "N/A",
            "checks": [],
            "suggestions": ["Start typing a password to see its strength."],
            "composition": char_composition(""),
            "fingerprint": "",
        }

    checks = []
    suggestions = []
    points = 0

    # 1. Length
    length = len(password)
    if length >= 12:
        checks.append({"label": "Length (12+ characters)", "passed": True})
        points += 2
    elif length >= 8:
        checks.append({"label": "Length (8+ characters)", "passed": True})
        points += 1
        suggestions.append("Use 12+ characters for stronger protection.")
    else:
        checks.append({"label": "Length (minimum 8 characters)", "passed": False})
        suggestions.append("Password is too short — use at least 8 characters.")

    # 2. Uppercase
    has_upper = bool(re.search(r'[A-Z]', password))
    checks.append({"label": "Contains uppercase letter", "passed": has_upper})
    if has_upper:
        points += 1
    else:
        suggestions.append("Add at least one uppercase letter (A-Z).")

    # 3. Lowercase
    has_lower = bool(re.search(r'[a-z]', password))
    checks.append({"label": "Contains lowercase letter", "passed": has_lower})
    if has_lower:
        points += 1
    else:
        suggestions.append("Add at least one lowercase letter (a-z).")

    # 4. Digit
    has_digit = bool(re.search(r'[0-9]', password))
    checks.append({"label": "Contains a digit", "passed": has_digit})
    if has_digit:
        points += 1
    else:
        suggestions.append("Add at least one number (0-9).")

    # 5. Special character
    has_special = bool(re.search(r'[^a-zA-Z0-9]', password))
    checks.append({"label": "Contains special character", "passed": has_special})
    if has_special:
        points += 1
    else:
        suggestions.append("Add a special character (e.g. ! @ # $ %).")

    # 6. Not a common/breached password
    is_common = password.lower() in COMMON_PASSWORDS
    checks.append({"label": "Not a commonly used / leaked password", "passed": not is_common})
    if not is_common:
        points += 1
    else:
        suggestions.append("This is a widely known/leaked password — avoid it entirely.")

    # 7. No sequential, keyboard, or repeated patterns
    is_sequential = has_sequential_chars(password)
    is_keyboard = has_keyboard_pattern(password)
    is_repeated = has_repeated_chars(password)
    has_pattern = is_sequential or is_keyboard or is_repeated
    checks.append({"label": "No sequential / keyboard / repeated patterns", "passed": not has_pattern})
    if not has_pattern:
        points += 0.5
    else:
        suggestions.append("Avoid sequences ('abcd', '1234'), keyboard walks ('1qaz'), or repeats ('aaaa').")

    # 8. No obvious dates / birth years
    is_date = has_obvious_date(password)
    checks.append({"label": "No obvious dates / birth years", "passed": not is_date})
    if not is_date:
        points += 0.5
    else:
        suggestions.append("Avoid birth years and date patterns (e.g. '1990', '12-09-1988').")

    entropy = calculate_entropy(password)
    crack_time = estimate_crack_time(entropy)

    # Final scoring — combine rule points with entropy for a 0-100 score
    rule_score = (points / MAX_POINTS) * 60  # 60% weight to rules
    entropy_score = min(entropy / 80, 1) * 40  # 40% weight to entropy (cap at 80 bits)
    final_score = round(rule_score + entropy_score)
    final_score = max(0, min(100, final_score))

    # Hard penalty for common passwords, regardless of other factors
    if is_common:
        final_score = min(final_score, 15)

    if final_score >= 80:
        label = "Very Strong"
    elif final_score >= 60:
        label = "Strong"
    elif final_score >= 35:
        label = "Medium"
    elif final_score >= 15:
        label = "Weak"
    else:
        label = "Very Weak"

    if not suggestions:
        suggestions.append("Great job! This password follows all recommended practices.")

    return {
        "score": final_score,
        "label": label,
        "entropy": entropy,
        "crack_time": crack_time,
        "checks": checks,
        "suggestions": suggestions,
        "composition": char_composition(password),
        "fingerprint": password_fingerprint(password),
    }


def generate_password(length=16, use_upper=True, use_lower=True, use_digits=True,
                      use_special=True, exclude_ambiguous=False):
    """Generates a cryptographically secure random password using the
    'secrets' module. Guarantees at least one character from every selected set.
    """
    pools = []
    if use_lower:
        pools.append(string.ascii_lowercase)
    if use_upper:
        pools.append(string.ascii_uppercase)
    if use_digits:
        pools.append(string.digits)
    if use_special:
        pools.append("!@#$%^&*()-_=+[]{}?")

    if not pools:
        return {"error": "Select at least one character type."}

    if exclude_ambiguous:
        for i, p in enumerate(pools):
            if any(ch.isalnum() for ch in p):
                pools[i] = "".join(c for c in p if c not in AMBIGUOUS_CHARS)
        pools = [p for p in pools if p]
        if not pools:
            return {"error": "Ambiguous-exclusion removed every selected character type."}

    length = max(4, min(length, 128))  # sane bounds

    # Guarantee at least one char from each selected pool, then fill the rest
    password_chars = [secrets.choice(pool) for pool in pools]
    all_chars = "".join(pools)
    password_chars += [secrets.choice(all_chars) for _ in range(length - len(password_chars))]

    # Shuffle securely so the guaranteed chars aren't always at the start
    for i in range(len(password_chars) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        password_chars[i], password_chars[j] = password_chars[j], password_chars[i]

    password = "".join(password_chars)
    return {"password": password, "analysis": analyze_password(password)}


def generate_passphrase(num_words=5, separator="-", capitalize=True, add_digit=False):
    """Generates a memorable passphrase from a curated word list."""
    num_words = max(3, min(num_words, 10))
    separator = separator if separator in ("-", ".", "_", " ") else "-"

    chosen = [secrets.choice(PASSPHRASE_WORDS) for _ in range(num_words)]
    if capitalize:
        chosen = [w.capitalize() for w in chosen]
    phrase = separator.join(chosen)
    if add_digit:
        phrase += str(secrets.randbelow(10))

    return {"password": phrase, "analysis": analyze_password(phrase)}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json() or {}
    password = data.get('password', '')
    return jsonify(analyze_password(password))


@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json() or {}
    length = int(data.get('length', 16))
    use_upper = bool(data.get('use_upper', True))
    use_lower = bool(data.get('use_lower', True))
    use_digits = bool(data.get('use_digits', True))
    use_special = bool(data.get('use_special', True))
    exclude_ambiguous = bool(data.get('exclude_ambiguous', False))

    result = generate_password(length, use_upper, use_lower, use_digits,
                               use_special, exclude_ambiguous)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


@app.route('/generate_passphrase', methods=['POST'])
def generate_passphrase_route():
    data = request.get_json() or {}
    words = int(data.get('words', 5))
    separator = str(data.get('separator', '-'))
    capitalize = bool(data.get('capitalize', True))
    add_digit = bool(data.get('add_digit', False))
    return jsonify(generate_passphrase(words, separator, capitalize, add_digit))


if __name__ == '__main__':
    app.run(debug=True, port=5000)
