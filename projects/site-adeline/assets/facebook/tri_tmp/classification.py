# index -> category, from visual review of sheet_00..sheet_04.jpg
CATS = {
    "sacs": "Sacs",
    "sacoches_ordi": "Sacoches ordinateur",
    "pochettes": "Pochettes",
    "trousses": "Trousses",
    "quotidien": "Accessoires du quotidien",
    "cadeaux": "Pieces cadeaux et saisonnieres",
    "autre": "A trier - non produit ou ambigu",
}

S, O, P, T, Q, C, X = "sacs", "sacoches_ordi", "pochettes", "trousses", "quotidien", "cadeaux", "autre"

classification = {
    0: S, 1: S, 2: S, 3: S, 4: S, 5: S, 6: S, 7: S, 8: S, 9: S, 10: S,
    11: X, 12: X, 13: Q, 14: S, 15: S, 16: Q, 17: Q, 18: Q, 19: S, 20: Q,
    21: S, 22: X, 23: X, 24: X,
    25: X, 26: X, 27: Q, 28: Q, 29: Q, 30: S, 31: S, 32: T, 33: X, 34: S,
    35: X, 36: P, 37: O, 38: C, 39: O,
    40: T, 41: O, 42: S, 43: P, 44: S, 45: X, 46: P, 47: C, 48: P, 49: S,
    50: S, 51: O, 52: P, 53: S, 54: Q, 55: X, 56: Q, 57: T, 58: T, 59: S,
    60: S, 61: T, 62: Q, 63: X, 64: X, 65: X, 66: Q, 67: C, 68: X, 69: P,
    70: T, 71: T, 72: T, 73: S, 74: P,
    75: X, 76: T, 77: P, 78: T, 79: Q,
    80: P, 81: X, 82: T, 83: X, 84: Q,
    85: P, 86: P, 87: O, 88: X, 89: X,
    90: X, 91: Q, 92: X, 93: X, 94: T,
    95: T, 96: X, 97: T, 98: X, 99: P,
    100: T, 101: T, 102: X, 103: S, 104: X,
    105: X, 106: X, 107: X, 108: P, 109: X,
    110: X, 111: X, 112: T, 113: T, 114: Q,
    115: Q, 116: Q, 117: Q, 118: Q, 119: X,
    120: X, 121: X, 122: X, 123: X, 124: X,
}
