#!/usr/bin/env python3
"""
ASCπ Meaning Transport Protocol (AMTP) v1.0
Reference Implementation

Author: Marcel Christian Mulder
License: Humanity Heritage License π
"""

import struct
import math
import crcmod
import codecs
from typing import List, Tuple, Dict, Optional, NamedTuple
from dataclasses import dataclass
from enum import IntEnum
import numpy as np

class LanguageID(IntEnum):
    ASCII = 0x00
    UTF8_GENERIC = 0x01
    CHINESE_SIMPLIFIED = 0x02
    CHINESE_TRADITIONAL = 0x03
    JAPANESE = 0x04
    KOREAN = 0x05
    ARABIC = 0x06
    RUSSIAN_CYRILLIC = 0x07
    HINDI_DEVANAGARI = 0x08
    BINARY_RAW = 0xFF

@dataclass
class FieldOperator:
    """Single character field mapping"""
    delta_phi: float  # Tension [-1.0, 1.0]
    kappa: float      # Curvature [-1.0, 1.0]
    theta: float      # Phase [0, 2π]
    codepoint: int    # Original Unicode codepoint

@dataclass
class ModuleState:
    """State of an I8/E8/S8 module"""
    value: float
    energy: float
    coherence: float
    stability: float

@dataclass
class AMTPResult:
    """Complete AMTP decoding result"""
    i8_state: ModuleState
    e8_state: ModuleState
    s8_state: ModuleState
    field_sequence: List[FieldOperator]
    total_coherence: float
    semantic_density: float
    
class AMTPPacket(NamedTuple):
    """AMTP protocol packet structure"""
    magic: bytes
    version: int
    language_id: int
    payload_length: int
    payload: bytes
    checksum: int

class FieldMapper:
    """Character codepoint to ΔΦ-κ-θ mapping engine"""
    
    @staticmethod
    def map_ascii_char(codepoint: int) -> FieldOperator:
        """Map ASCII character (0x00-0x7F) to field operators"""
        delta_phi = (codepoint / 127.0) * 2.0 - 1.0
        kappa = math.sin(codepoint * math.pi / 64.0)
        theta = (codepoint % 32) * math.pi / 16.0
        
        return FieldOperator(delta_phi, kappa, theta, codepoint)
    
    @staticmethod
    def map_unicode_char(codepoint: int, language_id: LanguageID) -> FieldOperator:
        """Map Unicode character to field operators with language-specific adjustments"""
        
        if codepoint <= 0x7F:
            return FieldMapper.map_ascii_char(codepoint)
        
        # Base Unicode mapping
        base_phi = (codepoint / 1114111.0) * 2.0 - 1.0
        delta_phi = base_phi + 0.1 * math.sin(codepoint * math.pi / 1024.0)
        
        base_kappa = math.cos(codepoint * math.pi / 4096.0)
        kappa = base_kappa * (1.0 + 0.2 * math.sin(codepoint * math.pi / 256.0))
        
        base_theta = (codepoint % 256) * math.pi / 128.0
        theta = base_theta + 0.3 * math.cos(codepoint * math.pi / 512.0)
        
        # Language-specific adjustments
        if language_id in (LanguageID.CHINESE_SIMPLIFIED, LanguageID.CHINESE_TRADITIONAL):
            # Chinese characters - CJK Unified Ideographs
            if 0x4E00 <= codepoint <= 0x9FFF:
                delta_phi = math.tanh((codepoint - 0x4E00) / 8192.0)
                kappa = math.sin((codepoint % 256) * math.pi / 128.0) * 0.8
                theta = ((codepoint >> 8) % 256) * math.pi / 128.0
                
        elif language_id == LanguageID.ARABIC:
            # Arabic script - RTL bias
            delta_phi += 0.1
            kappa *= 1.2
            theta = (theta + math.pi) % (2 * math.pi)
            
        elif language_id == LanguageID.RUSSIAN_CYRILLIC:
            # Cyrillic - cultural tension signature
            delta_phi += 0.1
            theta += math.pi / 6
            
        elif language_id == LanguageID.JAPANESE:
            # Japanese - distinguish Hiragana/Katakana/Kanji
            if 0x3040 <= codepoint <= 0x309F:  # Hiragana
                kappa *= 0.8
                theta += math.pi / 8
            elif 0x30A0 <= codepoint <= 0x30FF:  # Katakana
                kappa *= 1.2
                theta += math.pi / 4
                
        # Normalize to valid ranges
        delta_phi = max(-1.0, min(1.0, delta_phi))
        kappa = max(-1.0, min(1.0, kappa))
        theta = theta % (2 * math.pi)
        
        return FieldOperator(delta_phi, kappa, theta, codepoint)

class CoherenceCalculator:
    """Field sequence coherence and stability analysis"""
    
    @staticmethod
    def calculate_sequence_coherence(field_sequence: List[FieldOperator]) -> float:
        """Calculate coherence across character sequence"""
        if len(field_sequence) < 2:
            return 1.0
            
        total_coherence = 0.0
        for i in range(1, len(field_sequence)):
            prev = field_sequence[i-1]
            curr = field_sequence[i]
            
            phase_coherence = abs(math.cos((curr.theta + prev.theta) / 2))
            tension_similarity = math.exp(-abs(curr.delta_phi - prev.delta_phi))
            
            total_coherence += phase_coherence * tension_similarity
            
        return total_coherence / (len(field_sequence) - 1)
    
    @staticmethod
    def calculate_phase_coherence(phases: List[float]) -> float:
        """Calculate phase coherence using circular statistics"""
        if not phases:
            return 0.0
            
        real_sum = sum(math.cos(theta) for theta in phases)
        imag_sum = sum(math.sin(theta) for theta in phases)
        
        return math.sqrt(real_sum**2 + imag_sum**2) / len(phases)
    
    @staticmethod
    def calculate_circular_mean(phases: List[float]) -> float:
        """Calculate circular mean of phase values"""
        if not phases:
            return 0.0
            
        real_sum = sum(math.cos(theta) for theta in phases)
        imag_sum = sum(math.sin(theta) for theta in phases)
        
        return math.atan2(imag_sum, real_sum)

class ModuleController:
    """I8/E8/S8 state management and computation"""
    
    @staticmethod
    def calculate_i8_state(field_sequence: List[FieldOperator]) -> ModuleState:
        """Calculate I8 Internal State module output"""
        if not field_sequence:
            return ModuleState(0.0, 0.0, 0.0, 1.0)
            
        delta_phis = [f.delta_phi for f in field_sequence]
        
        value = sum(delta_phis) / len(delta_phis)
        energy = math.sqrt(sum(dp**2 for dp in delta_phis)) / len(delta_phis)
        coherence = CoherenceCalculator.calculate_phase_coherence([f.theta for f in field_sequence])
        stability = 1.0 - min(1.0, np.var(delta_phis))
        
        return ModuleState(value, energy, coherence, stability)
    
    @staticmethod
    def calculate_e8_state(field_sequence: List[FieldOperator]) -> ModuleState:
        """Calculate E8 External Field module output"""
        if not field_sequence:
            return ModuleState(0.0, 0.0, 0.0, 1.0)
            
        kappas = [f.kappa for f in field_sequence]
        
        value = sum(kappas) / len(kappas)
        
        # Calculate maximum curvature change
        energy = 0.0
        if len(field_sequence) > 1:
            energy = max(abs(field_sequence[i].kappa - field_sequence[i-1].kappa) 
                        for i in range(1, len(field_sequence)))
        
        coherence = CoherenceCalculator.calculate_phase_coherence([f.theta for f in field_sequence])
        stability = 1.0 - min(1.0, np.var(kappas))
        
        return ModuleState(value, energy, coherence, stability)
    
    @staticmethod
    def calculate_s8_state(field_sequence: List[FieldOperator]) -> ModuleState:
        """Calculate S8 Snapshot module output"""
        if not field_sequence:
            return ModuleState(0.0, 0.0, 0.0, 1.0)
            
        phases = [f.theta for f in field_sequence]
        
        value = CoherenceCalculator.calculate_circular_mean(phases)
        energy = sum(f.delta_phi**2 + f.kappa**2 for f in field_sequence) / len(field_sequence)
        coherence = CoherenceCalculator.calculate_phase_coherence(phases)
        stability = coherence  # Phase stability correlates with coherence
        
        return ModuleState(value, energy, coherence, stability)

class SemanticAnalyzer:
    """Semantic density and meaning analysis"""
    
    @staticmethod
    def calculate_semantic_density(field_sequence: List[FieldOperator]) -> float:
        """Calculate semantic information density"""
        if not field_sequence:
            return 0.0
            
        # Energy density
        energy_density = sum(f.delta_phi**2 + f.kappa**2 for f in field_sequence) / len(field_sequence)
        
        # Phase complexity (number of unique phase regions)
        unique_phases = len(set(round(f.theta, 2) for f in field_sequence))
        phase_complexity = unique_phases / len(field_sequence)
        
        # Curvature variation
        kappas = [f.kappa for f in field_sequence]
        curvature_variation = np.var(kappas)
        
        # Combine measures using geometric mean
        density = (energy_density * phase_complexity * curvature_variation) ** (1/3)
        
        return density

class EncodingDetector:
    """Automatic text encoding detection"""
    
    ENCODING_SIGNATURES = {
        b'\xef\xbb\xbf': ('utf-8-sig', LanguageID.UTF8_GENERIC),
        b'\xff\xfe': ('utf-16-le', LanguageID.UTF8_GENERIC),
        b'\xfe\xff': ('utf-16-be', LanguageID.UTF8_GENERIC),
        b'\xff\xfe\x00\x00': ('utf-32-le', LanguageID.UTF8_GENERIC),
        b'\x00\x00\xfe\xff': ('utf-32-be', LanguageID.UTF8_GENERIC),
    }
    
    @staticmethod
    def detect_encoding(data: bytes) -> Tuple[str, LanguageID]:
        """Detect text encoding and suggest language ID"""
        
        # Check BOM signatures
        for bom, (encoding, lang_id) in EncodingDetector.ENCODING_SIGNATURES.items():
            if data.startswith(bom):
                return encoding, lang_id
        
        # Try common encodings
        encodings_to_try = [
            ('utf-8', LanguageID.UTF8_GENERIC),
            ('gb2312', LanguageID.CHINESE_SIMPLIFIED),
            ('big5', LanguageID.CHINESE_TRADITIONAL),
            ('shift_jis', LanguageID.JAPANESE),
            ('euc-kr', LanguageID.KOREAN),
            ('iso-8859-6', LanguageID.ARABIC),
            ('cp1251', LanguageID.RUSSIAN_CYRILLIC),
            ('ascii', LanguageID.ASCII),
        ]
        
        for encoding, lang_id in encodings_to_try:
            try:
                data.decode(encoding)
                return encoding, lang_id
            except UnicodeDecodeError:
                continue
                
        # Fallback
        return 'utf-8', LanguageID.UTF8_GENERIC

class AMTPDecoder:
    """Main AMTP decoder class"""
    
    def __init__(self):
        self.crc32 = crcmod.predefined.mkCrcFun('crc-32')
        
    def create_packet(self, data: bytes, language_id: LanguageID) -> bytes:
        """Create AMTP protocol packet"""
        magic = b'AMTP'
        version = 0x10  # v1.0
        payload_length = len(data)
        
        header = struct.pack('>4sBBH', magic, version, language_id, payload_length)
        checksum = self.crc32(header + data)
        
        packet = header + data + struct.pack('>I', checksum)
        return packet
    
    def parse_packet(self, packet_data: bytes) -> AMTPPacket:
        """Parse AMTP protocol packet"""
        if len(packet_data) < 12:  # Minimum packet size
            raise ValueError("Packet too small")
            
        # Parse header
        magic, version, language_id, payload_length = struct.unpack('>4sBBH', packet_data[:8])
        
        if magic != b'AMTP':
            raise ValueError("Invalid magic bytes")
            
        if version != 0x10:
            raise ValueError(f"Unsupported version: 0x{version:02x}")
            
        # Extract payload and checksum
        payload_end = 8 + payload_length
        if len(packet_data) < payload_end + 4:
            raise ValueError("Incomplete packet")
            
        payload = packet_data[8:payload_end]
        expected_checksum = struct.unpack('>I', packet_data[payload_end:payload_end+4])[0]
        
        # Verify checksum
        actual_checksum = self.crc32(packet_data[:payload_end])
        if actual_checksum != expected_checksum:
            raise ValueError(f"Checksum mismatch: {actual_checksum:08x} != {expected_checksum:08x}")
            
        return AMTPPacket(magic, version, language_id, payload_length, payload, expected_checksum)
    
    def decode_text_to_ascpi(self, text: str, language_id: Optional[LanguageID] = None) -> AMTPResult:
        """Decode text string to ASCπ field operators"""
        
        if language_id is None:
            language_id = self._detect_language(text)
            
        # Convert text to codepoints
        codepoints = [ord(c) for c in text]
        
        # Map to field operators
        field_sequence = [
            FieldMapper.map_unicode_char(cp, language_id) 
            for cp in codepoints
        ]
        
        # Calculate module states
        i8_state = ModuleController.calculate_i8_state(field_sequence)
        e8_state = ModuleController.calculate_e8_state(field_sequence)
        s8_state = ModuleController.calculate_s8_state(field_sequence)
        
        # Calculate global metrics
        total_coherence = CoherenceCalculator.calculate_sequence_coherence(field_sequence)
        semantic_density = SemanticAnalyzer.calculate_semantic_density(field_sequence)
        
        return AMTPResult(
            i8_state=i8_state,
            e8_state=e8_state,
            s8_state=s8_state,
            field_sequence=field_sequence,
            total_coherence=total_coherence,
            semantic_density=semantic_density
        )
    
    def decode_bytes_to_ascpi(self, data: bytes, language_id: Optional[LanguageID] = None) -> AMTPResult:
        """Decode raw bytes to ASCπ field operators"""
        
        if language_id is None:
            encoding, language_id = EncodingDetector.detect_encoding(data)
        else:
            encoding = self._get_encoding_for_language(language_id)
            
        try:
            text = data.decode(encoding)
            return self.decode_text_to_ascpi(text, language_id)
        except UnicodeDecodeError:
            # Fallback: treat as binary data
            return self._decode_binary_data(data)
    
    def _detect_language(self, text: str) -> LanguageID:
        """Simple language detection based on character ranges"""
        
        codepoints = [ord(c) for c in text]
        
        # Count characters by script
        latin_count = sum(1 for cp in codepoints if cp <= 0x7F)
        cjk_count = sum(1 for cp in codepoints if 0x4E00 <= cp <= 0x9FFF)
        hiragana_count = sum(1 for cp in codepoints if 0x3040 <= cp <= 0x309F)
        katakana_count = sum(1 for cp in codepoints if 0x30A0 <= cp <= 0x30FF)
        hangul_count = sum(1 for cp in codepoints if 0xAC00 <= cp <= 0xD7AF)
        arabic_count = sum(1 for cp in codepoints if 0x0600 <= cp <= 0x06FF)
        cyrillic_count = sum(1 for cp in codepoints if 0x0400 <= cp <= 0x04FF)
        
        total_chars = len(codepoints)
        
        if arabic_count / total_chars > 0.3:
            return LanguageID.ARABIC
        elif cyrillic_count / total_chars > 0.3:
            return LanguageID.RUSSIAN_CYRILLIC
        elif hangul_count / total_chars > 0.3:
            return LanguageID.KOREAN
        elif (hiragana_count + katakana_count) / total_chars > 0.2:
            return LanguageID.JAPANESE
        elif cjk_count / total_chars > 0.3:
            return LanguageID.CHINESE_SIMPLIFIED
        elif latin_count / total_chars > 0.8 and all(cp <= 0x7F for cp in codepoints):
            return LanguageID.ASCII
        else:
            return LanguageID.UTF8_GENERIC
    
    def _get_encoding_for_language(self, language_id: LanguageID) -> str:
        """Get default encoding for language ID"""
        encoding_map = {
            LanguageID.ASCII: 'ascii',
            LanguageID.UTF8_GENERIC: 'utf-8',
            LanguageID.CHINESE_SIMPLIFIED: 'gb2312',
            LanguageID.CHINESE_TRADITIONAL: 'big5',
            LanguageID.JAPANESE: 'shift_jis',
            LanguageID.KOREAN: 'euc-kr',
            LanguageID.ARABIC: 'iso-8859-6',
            LanguageID.RUSSIAN_CYRILLIC: 'cp1251',
            LanguageID.HINDI_DEVANAGARI: 'utf-8',
            LanguageID.BINARY_RAW: 'latin1',
        }
        return encoding_map.get(language_id, 'utf-8')
    
    def _decode_binary_data(self, data: bytes) -> AMTPResult:
        """Decode binary data as raw byte values"""
        field_sequence = [
            FieldMapper.map_ascii_char(byte) for byte in data
        ]
        
        i8_state = ModuleController.calculate_i8_state(field_sequence)
        e8_state = ModuleController.calculate_e8_state(field_sequence)
        s8_state = ModuleController.calculate_s8_state(field_sequence)
        
        total_coherence = CoherenceCalculator.calculate_sequence_coherence(field_sequence)
        semantic_density = SemanticAnalyzer.calculate_semantic_density(field_sequence)
        
        return AMTPResult(
            i8_state=i8_state,
            e8_state=e8_state,
            s8_state=s8_state,
            field_sequence=field_sequence,
            total_coherence=total_coherence,
            semantic_density=semantic_density
        )

# Example usage and test functions
def test_amtp_decoder():
    """Test AMTP decoder with various languages"""
    
    decoder = AMTPDecoder()
    
    test_cases = [
        ("Hello World!", LanguageID.ASCII),
        ("你好世界！", LanguageID.CHINESE_SIMPLIFIED),
        ("こんにちは世界！", LanguageID.JAPANESE),
        ("안녕하세요 세계!", LanguageID.KOREAN),
        ("مرحبا بالعالم!", LanguageID.ARABIC),
        ("Привет мир!", LanguageID.RUSSIAN_CYRILLIC),
        ("🌍🚀✨💡🔬", LanguageID.UTF8_GENERIC),
    ]
    
    print("AMTP v1.0 Decoder Test Results")
    print("=" * 50)
    
    for text, lang_id in test_cases:
        result = decoder.decode_text_to_ascpi(text, lang_id)
        
        print(f"Text: {text}")
        print(f"Language: {lang_id.name}")
        print(f"I8 State: ΔΦ={result.i8_state.value:.3f} Energy={result.i8_state.energy:.3f}")
        print(f"E8 State: κ={result.e8_state.value:.3f} Stability={result.e8_state.stability:.3f}")
        print(f"S8 State: θ={result.s8_state.value:.3f} Coherence={result.s8_state.coherence:.3f}")
        print(f"Total Coherence: {result.total_coherence:.3f}")
        print(f"Semantic Density: {result.semantic_density:.3f}")
        print("-" * 30)

if __name__ == "__main__":
    test_amtp_decoder()